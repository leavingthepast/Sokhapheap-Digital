const fs = require('fs');
let code = fs.readFileSync('src/utils/qrAccessManager.ts', 'utf8');

if (!code.includes('import { supabase }')) {
  code = `import { supabase } from '../supabaseClient';\n` + code;
}

// update submitQrAccessRequest
code = code.replace(
  `  // 2. Post to backend server\n  try {\n    const res = await fetch('/api/qr-access/request', {`,
  `  // 2. Post to backend server & Supabase
  try {
    const { error: supaErr } = await supabase.from('access_requests').insert({
      id: requestId,
      patient_id: params.patientId,
      qr_token: params.qrToken,
      requester_name: newRequest.requesterName,
      requester_role: newRequest.requesterRole,
      requester_location: newRequest.requesterLocation,
      status: 'pending',
      requested_at: newRequest.requestedAt
    });
    if (supaErr) console.warn('[Supabase Sync] QR request error:', supaErr);

    const res = await fetch('/api/qr-access/request', {`
);

// update checkQrAccessStatus
code = code.replace(
  `export async function checkQrAccessStatus(params: { patientId: string; requestId: string; qrToken?: string }): Promise<QrAccessStatus> {\n  const reqId = params.requestId;\n  // 1. Check server first\n  try {`,
  `export async function checkQrAccessStatus(params: { patientId: string; requestId: string; qrToken?: string }): Promise<QrAccessStatus> {
  const reqId = params.requestId;
  
  // 0. Check Supabase First
  try {
    const { data } = await supabase.from('access_requests').select('status').eq('id', reqId).single();
    if (data && data.status) return data.status;
  } catch (e) {}

  // 1. Check server fallback
  try {`
);

// update updateQrAccessDecision
code = code.replace(
  `  // 3. Notify server immediately\n  try {\n    await fetch('/api/qr-access/respond', {`,
  `  // 3. Notify server & Supabase immediately
  try {
    await supabase.from('access_requests').update({ 
      status: newStatus,
      responded_at: nowIso
    }).eq('id', requestId);
    
    await fetch('/api/qr-access/respond', {`
);

// update fetchIncomingRequests
code = code.replace(
  `export async function fetchIncomingRequests(patientId: string): Promise<QrAccessRequest[] | null> {\n  try {\n    const res = await fetch(\`/api/qr-access/requests?patientId=\${encodeURIComponent(patientId)}\`);`,
  `export async function fetchIncomingRequests(patientId: string): Promise<QrAccessRequest[] | null> {
  try {
    // Check Supabase first
    const { data: supaReqs } = await supabase.from('access_requests').select('*').eq('patient_id', patientId);
    if (supaReqs && supaReqs.length > 0) {
      return supaReqs.map((r: any) => ({
        id: r.id,
        patientId: r.patient_id,
        qrToken: r.qr_token,
        requesterName: r.requester_name,
        requesterRole: r.requester_role,
        requesterLocation: r.requester_location,
        status: r.status,
        requestedAt: r.requested_at,
        respondedAt: r.responded_at
      }));
    }
  } catch(e) {}
  
  try {
    const res = await fetch(\`/api/qr-access/requests?patientId=\${encodeURIComponent(patientId)}\`);`
);

fs.writeFileSync('src/utils/qrAccessManager.ts', code);
