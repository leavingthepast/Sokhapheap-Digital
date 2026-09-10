const fs = require('fs');
let code = fs.readFileSync('src/utils/qrAccessManager.ts', 'utf8');

// The backend endpoints don't push to supabase by themselves (unless we change server.ts).
// It's probably better to push to supabase directly from the frontend or update server.ts to push to supabase.

console.log(code.includes("supabase.from('access_requests')"));
