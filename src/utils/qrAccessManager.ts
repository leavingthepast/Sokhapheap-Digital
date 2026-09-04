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
 * Query current authorization status for a request ID
 * Strictly check by unique requestId to prevent granting blanket access to others
 */
export async function checkQrAccessStatus(params: {
  patientId: string;
  requestId?: string;
  qrToken?: string;
}): Promise<QrAccessStatus> {
  const reqId = params.requestId || getSavedRequestIdForPatient(params.patientId);
  if (!reqId) return 'none';

  // 1. Try server endpoint
  try {
    const query = new URLSearchParams();
    query.set('patientId', params.patientId);
    query.set('requestId', reqId);
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
        const found = matchPatient.accessRequests.find(r => r.id === reqId);
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
  const nowIso = new Date().toISOString();

  // 1. Immediately update local stored patient object so any tab reading localStorage sees it
  try {
    const raw = localStorage.getItem('sokhapheap_digital_patients_v2');
    if (raw) {
      const patients: any[] = JSON.parse(raw);
      const matchPatient = patients.find((p: any) => p.id === patientId);
      if (matchPatient) {
        if (!Array.isArray(matchPatient.accessRequests)) {
          matchPatient.accessRequests = [];
        }
        const target = matchPatient.accessRequests.find((r: any) => r.id === requestId);
        if (target) {
          target.status = newStatus;
          target.respondedAt = nowIso;
        } else {
          matchPatient.accessRequests.unshift({
            id: requestId,
            patientId,
            status: newStatus,
            respondedAt: nowIso,
            requestedAt: nowIso,
            requesterName: 'Clinical Doctor',
          });
        }
        localStorage.setItem('sokhapheap_digital_patients_v2', JSON.stringify(patients));
      }
    }
  } catch {
    // ignore
  }

  // 2. Broadcast locally
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

  // 3. Notify server immediately
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
 * Play a pleasant, non-intrusive hospital notification audio chime
 * using native Web Audio API (Zero external assets needed)
 */
export function playNotificationAlertChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Bell 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Bell 2: B5 (987.77 Hz) - bright harmonic chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch {
    // audio may be blocked if no user gesture
  }
}

/**
 * Subscribe to access request status changes for a scanner session.
 * Uses Server-Sent Events (SSE) for instant, millisecond push response
 * when the patient clicks "Allow", plus BroadcastChannel and fast polling.
 */
export function subscribeToAccessDecision(
  patientId: string,
  requestId: string | null,
  callback: (status: QrAccessStatus) => void
): () => void {
  let isClosed = false;
  let eventSource: EventSource | null = null;

  // 1. Instant SSE Push Subscription
  if (typeof window !== 'undefined' && 'EventSource' in window && requestId) {
    try {
      eventSource = new EventSource(`/api/qr-access/events?requestId=${encodeURIComponent(requestId)}`);
      eventSource.onmessage = (e) => {
        if (isClosed || !e.data) return;
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'DECISION' && parsed.requestId === requestId) {
            callback(parsed.status);
          }
        } catch {
          // ignore
        }
      };
      eventSource.onerror = () => {
        // SSE will attempt reconnection automatically; fallback polling handles gap
      };
    } catch {
      // ignore
    }
  }

  // 2. BroadcastChannel listener (instant for same-browser testing)
  const handleBcMessage = (event: MessageEvent) => {
    if (isClosed) return;
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

  // 3. Window storage listener (cross-tab fallback)
  const handleStorage = (event: StorageEvent) => {
    if (isClosed) return;
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

  // 4. Fast polling fallback (every 350ms) for high-speed zero-lag responsiveness
  const intervalId = setInterval(async () => {
    if (isClosed) return;
    try {
      const current = await checkQrAccessStatus({ patientId, requestId: requestId || undefined });
      if (current === 'allowed' || current === 'not_allowed') {
        callback(current);
      }
    } catch {
      // ignore
    }
  }, 350);

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    window.removeEventListener('storage', handleStorage);
    clearInterval(intervalId);
  };
}

/**
 * Patient-side subscription to incoming QR access requests.
 * Uses Server-Sent Events (SSE) for instant alerts when a scan request occurs,
 * plus BroadcastChannel and polling.
 */
export function subscribeToIncomingRequests(
  patientId: string,
  onRequestsUpdate: (requests: QrAccessRequest[], isNewAlert?: boolean) => void
): () => void {
  let isClosed = false;
  let eventSource: EventSource | null = null;

  // 1. Instant SSE Push Subscription
  if (typeof window !== 'undefined' && 'EventSource' in window && patientId) {
    try {
      eventSource = new EventSource(`/api/qr-access/events?patientId=${encodeURIComponent(patientId)}`);
      eventSource.onmessage = (e) => {
        if (isClosed || !e.data) return;
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'NEW_REQUEST_ALERT') {
            playNotificationAlertChime();
            if (Array.isArray(parsed.requests)) {
              onRequestsUpdate(parsed.requests, true);
            } else if (parsed.request) {
              fetchIncomingRequests(patientId).then((list) => {
                if (list) onRequestsUpdate(list, true);
              });
            }
          } else if (parsed.type === 'REQUESTS_UPDATED' && Array.isArray(parsed.requests)) {
            onRequestsUpdate(parsed.requests, false);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  }

  // 2. BroadcastChannel listener
  const handleBcMessage = (event: MessageEvent) => {
    if (isClosed) return;
    const data = event.data;
    if (data && data.type === 'ACCESS_REQUEST_SUBMITTED') {
      const req: QrAccessRequest = data.request;
      if (req.patientId === patientId) {
        playNotificationAlertChime();
        fetchIncomingRequests(patientId).then((list) => {
          if (list) onRequestsUpdate(list, true);
        });
      }
    }
  };

  // 3. Window storage listener
  const handleStorage = (event: StorageEvent) => {
    if (isClosed) return;
    if (event.key === 'sokhapheap_latest_qr_request_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.request?.patientId === patientId) {
          playNotificationAlertChime();
          fetchIncomingRequests(patientId).then((list) => {
            if (list) onRequestsUpdate(list, true);
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

  // 4. Polling fallback (every 1.5 seconds)
  const pollInterval = setInterval(async () => {
    if (isClosed) return;
    try {
      const list = await fetchIncomingRequests(patientId);
      if (list && list.length > 0) {
        onRequestsUpdate(list, false);
      }
    } catch {
      // ignore
    }
  }, 1500);

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
    }
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

