const fs = require('fs');
let code = fs.readFileSync('src/utils/qrAccessManager.ts', 'utf8');

code += `\n
export function subscribeToIncomingRequests(
  patientId: string,
  onRequestsUpdate: (requests: QrAccessRequest[], isNewAlert?: boolean) => void
): () => void {
  let isClosed = false;
  let eventSource: EventSource | null = null;
  let supaChannel: any = null;

  // Immediate initial fetch
  if (patientId) {
    fetchIncomingRequests(patientId).then((list) => {
      if (list && list.length > 0 && !isClosed) {
        onRequestsUpdate(list, false);
      }
    }).catch(() => {});
  }

  // 1. Supabase Realtime Subscription
  try {
    supaChannel = supabase
      .channel(\`public:access_requests:patient_id=eq.\${patientId}\`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'access_requests', filter: \`patient_id=eq.\${patientId}\` },
        async () => {
          if (isClosed) return;
          playNotificationAlertChime();
          const list = await fetchIncomingRequests(patientId);
          if (list) onRequestsUpdate(list, true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'access_requests', filter: \`patient_id=eq.\${patientId}\` },
        async () => {
          if (isClosed) return;
          const list = await fetchIncomingRequests(patientId);
          if (list) onRequestsUpdate(list, false);
        }
      )
      .subscribe();
  } catch (e) {
    console.warn('[Supabase Realtime] Subscribe failed:', e);
  }

  // 2. Instant SSE Push Subscription (Fallback)
  if (typeof window !== 'undefined' && 'EventSource' in window && patientId) {
    try {
      eventSource = new EventSource(\`/api/qr-access/events?patientId=\${encodeURIComponent(patientId)}\`);
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

  // 3. BroadcastChannel listener
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

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
    }
    if (supaChannel) {
      supabase.removeChannel(supaChannel);
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
  };
}
`;

fs.writeFileSync('src/utils/qrAccessManager.ts', code);
