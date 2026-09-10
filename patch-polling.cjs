const fs = require('fs');
let code = fs.readFileSync('src/utils/qrAccessManager.ts', 'utf8');

// Add polling to subscribeToIncomingRequests
const incomingCleanupPattern = `  return () => {
    isClosed = true;`;
    
const incomingPolling = `  // 4. Polling fallback (every 2.5 seconds) to guarantee delivery even if Realtime is disabled
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
  }, 2500);

  return () => {
    isClosed = true;
    clearInterval(pollInterval);`;

code = code.replace(incomingCleanupPattern, incomingPolling);

// Add polling to subscribeToAccessDecision
const decisionCleanupPattern = `  return () => {
    isClosed = true;
    if (eventSource) {`;

const decisionPolling = `  // 3. Fast polling fallback (every 1 second) for guaranteed responsiveness
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
  }, 1000);

  return () => {
    isClosed = true;
    clearInterval(intervalId);
    if (eventSource) {`;

code = code.replace(decisionCleanupPattern, decisionPolling);

fs.writeFileSync('src/utils/qrAccessManager.ts', code);
