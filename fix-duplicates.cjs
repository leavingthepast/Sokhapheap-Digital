const fs = require('fs');
let code = fs.readFileSync('src/utils/qrAccessManager.ts', 'utf8');

code = code.replace(
`  let isClosed = false;
  let eventSource: EventSource | null = null;
  let supaChannel: any = null;

  try {`,
`  let supaChannel: any = null;

  try {`
);

fs.writeFileSync('src/utils/qrAccessManager.ts', code);
