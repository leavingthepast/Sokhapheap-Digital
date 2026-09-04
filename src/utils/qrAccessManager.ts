import { QrAccessRequest, QrAccessStatus, Patient } from '../types';

const ACCESS_CHANNEL_NAME = 'sokhapheap_qr_access_channel';
const STORAGE_DEVICE_KEY = 'sokhapheap_scanner_device_id';
const STORAGE_REQUEST_PREFIX = 'sokhapheap_qr_req_';

// BroadcastChannel for instant cross-tab / cross-window communication on same browser
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(ACCESS_CHANNEL_NAME);
  }
} catch {
  // fallback
}

/**
 * Get or generate a persistent scanner device identifier
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'device-server';
  try {
    let devId = localStorage.getItem(STORAGE_DEVICE_KEY);
    if (!devId) {
      devId = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(STORAGE_DEVICE_KEY, devId);
    }
    return devId;
  } catch {
    return `dev-${Date.now().toString(36)}`;
  }
}

/**
 * Get the last active access request ID for a given patient on this device
 */
export function getSavedRequestIdForPatient(patientId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`${STORAGE_REQUEST_PREFIX}${patientId}`);
  } catch {
    return null;
  }
}

/**
 * Save the active access request ID for a patient on this device
 */
export function saveRequestIdForPatient(patientId: string, requestId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_REQUEST_PREFIX}${patientId}`, requestId);
  } catch {
    // ignore
  }
}

/**
 * Send an access request from scanner to patient
 */
export async function submitQrAccessRequest(params: {
  patientId: string;
  qrToken?: string;
  requesterName?: string;
  requesterRole?: string;
  requesterLocation?: string;
}): Promise<QrAccessRequest> {
  const deviceId = getOrCreateDeviceId();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newRequest: QrAccessRequest = {
    id: requestId,
    patientId: params.patientId,
    requesterName: params.requesterName || 'Emergency Physician',
    requesterRole: params.requesterRole || 'Clinical Doctor',
    requesterLocation: params.requesterLocation || 'Emergency Care Facility',
    requestedAt: new Date().toISOString(),
    status: 'pending',
    qrToken: params.qrToken,
    deviceId,
  };

  saveRequestIdForPatient(params.patientId, requestId);

  // 1. Broadcast locally
  try {
    broadcastChannel?.postMessage({
      type: 'ACCESS_REQUEST_SUBMITTED',
      request: newRequest,
      timestamp: Date.now(),
    });
    localStorage.setItem('sokhapheap_latest_qr_request_event', JSON.stringify({
      request: newRequest,
      timestamp: Date.now(),
    }));
  } catch {
    // ignore
  }

  // 2. Post to backend server
  try {
    const res = await fetch('/api/qr-access/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        patientId: params.patientId,
        qrToken: params.qrToken,
        requesterName: newRequest.requesterName,
        requesterRole: newRequest.requesterRole,
        requesterLocation: newRequest.requesterLocation,
        deviceId,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.request) {
        return json.request;
      }
    }
  } catch (err) {
    console.warn('[QR Access] Server submit request note:', err);
  }

  return newRequest;
}

/**
 * Query current authorization status for a request ID or device
 */
export async function checkQrAccessStatus(params: {
  patientId: string;
  requestId?: string;
  qrToken?: string;
}): Promise<QrAccessStatus> {
  const deviceId = getOrCreateDeviceId();
  const reqId = params.requestId || getSavedRequestIdForPatient(params.patientId);

  // 1. Try server endpoint
  try {
    const query = new URLSearchParams();
    query.set('patientId', params.patientId);
    if (reqId) query.set('requestId', reqId);
    if (deviceId) query.set('deviceId', deviceId);
    if (params.qrToken) query.set('qrToken', params.qrToken);

    const res = await fetch(`/api/qr-access/status?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.status && json.status !== 'none') {
        return json.status as QrAccessStatus;
      }
    }
  } catch (err) {
    // server check fallback
  }

  // 2. Check local stored patients if on same device/browser
  try {
    const storedRaw = localStorage.getItem('sokhapheap_digital_patients_v2');
    if (storedRaw) {
      const patients: Patient[] = JSON.parse(storedRaw);
      const matchPatient = patients.find(p => p.id === params.patientId || (params.qrToken && p.qrToken === params.qrToken));
      if (matchPatient && Array.isArray(matchPatient.accessRequests)) {
        const found = matchPatient.accessRequests.find(r => 
          (reqId && r.id === reqId) || (deviceId && r.deviceId === deviceId)
        );
        if (found) {
          return found.status;
        }
      }
    }
  } catch {
    // ignore
  }

  return 'pending';
}

/**
 * Update request status (Allow or Not Allowed)
 */
export async function updateQrAccessDecision(
  patientId: string,
  requestId: string,
  newStatus: 'allowed' | 'not_allowed'
): Promise<boolean> {
  // 1. Broadcast locally
  try {
    broadcastChannel?.postMessage({
      type: 'ACCESS_REQUEST_DECIDED',
      patientId,
      requestId,
      status: newStatus,
      timestamp: Date.now(),
    });
    localStorage.setItem('sokhapheap_latest_qr_decision_event', JSON.stringify({
      patientId,
      requestId,
      status: newStatus,
      timestamp: Date.now(),
    }));
  } catch {
    // ignore
  }

  // 2. Notify server
  try {
    await fetch('/api/qr-access/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        requestId,
        status: newStatus,
      }),
    });
    return true;
  } catch (err) {
    console.warn('[QR Access] Server respond note:', err);
    return false;
  }
}

/**
 * Subscribe to access request status changes (both BroadcastChannel and polling)
 */
export function subscribeToAccessDecision(
  patientId: string,
  requestId: string | null,
  callback: (status: QrAccessStatus) => void
): () => void {
  const deviceId = getOrCreateDeviceId();

  // BroadcastChannel listener
  const handleBcMessage = (event: MessageEvent) => {
    const data = event.data;
    if (
      data &&
      data.type === 'ACCESS_REQUEST_DECIDED' &&
      data.patientId === patientId &&
      (!requestId || data.requestId === requestId)
    ) {
      callback(data.status);
    }
  };

  // Window storage listener (cross-tab fallback)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'sokhapheap_latest_qr_decision_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (
          parsed.patientId === patientId &&
          (!requestId || parsed.requestId === requestId)
        ) {
          callback(parsed.status);
        }
      } catch {
        // ignore
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }
  window.addEventListener('storage', handleStorage);

  // Periodic fallback poll (every 1.5s) for mobile scanning
  const intervalId = setInterval(async () => {
    try {
      const current = await checkQrAccessStatus({ patientId, requestId: requestId || undefined });
      if (current === 'allowed' || current === 'not_allowed') {
        callback(current);
      }
    } catch {
      // ignore
    }
  }, 1500);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    window.removeEventListener('storage', handleStorage);
    clearInterval(intervalId);
  };
}

/**
 * Patient-side subscription to incoming QR access requests
 */
export function subscribeToIncomingRequests(
  patientId: string,
  onRequestsUpdate: (requests: QrAccessRequest[]) => void
): () => void {
  const handleBcMessage = (event: MessageEvent) => {
    const data = event.data;
    if (data && data.type === 'ACCESS_REQUEST_SUBMITTED') {
      const req: QrAccessRequest = data.request;
      if (req.patientId === patientId) {
        fetchIncomingRequests(patientId).then((list) => {
          if (list) onRequestsUpdate(list);
        });
      }
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'sokhapheap_latest_qr_request_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.request?.patientId === patientId) {
          fetchIncomingRequests(patientId).then((list) => {
            if (list) onRequestsUpdate(list);
          });
        }
      } catch {
        // ignore
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }
  window.addEventListener('storage', handleStorage);

  // Poll every 3 seconds for new requests from remote devices/scanners
  const pollInterval = setInterval(async () => {
    try {
      const list = await fetchIncomingRequests(patientId);
      if (list) onRequestsUpdate(list);
    } catch {
      // ignore
    }
  }, 3000);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    window.removeEventListener('storage', handleStorage);
    clearInterval(pollInterval);
  };
}

export async function fetchIncomingRequests(patientId: string): Promise<QrAccessRequest[] | null> {
  try {
    const res = await fetch(`/api/qr-access/requests?patientId=${encodeURIComponent(patientId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.requests)) {
        return json.requests;
      }
    }
  } catch {
    // fallback
  }
  return null;
}

