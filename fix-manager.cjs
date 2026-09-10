const fs = require('fs');
let code = fs.readFileSync('src/utils/qrAccessManager.ts', 'utf8');

const statusStart = code.indexOf('export async function checkQrAccessStatus');
const statusEnd = code.indexOf('export async function checkQrAccessStatus', statusStart + 1); // just in case

// Fix checkQrAccessStatus
code = code.replace(
`  // 1. Try server endpoint
  try {
    const query = new URLSearchParams();`,
`  // 0. Try Supabase
  try {
    const { data } = await supabase.from('access_requests').select('status').eq('id', reqId).single();
    if (data && data.status) return data.status as QrAccessStatus;
  } catch(e) {}

  // 1. Try server endpoint
  try {
    const query = new URLSearchParams();`
);

fs.writeFileSync('src/utils/qrAccessManager.ts', code);
