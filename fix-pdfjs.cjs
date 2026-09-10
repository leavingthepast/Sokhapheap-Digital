const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfRenderer.ts', 'utf8');

code = code.replace(
`    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }`,
`    if (pdfjsLib.GlobalWorkerOptions) {
      // Use the CDN directly to ensure it always works across all environments (Vercel, local, etc)
      pdfjsLib.GlobalWorkerOptions.workerSrc = \`https://unpkg.com/pdfjs-dist@\${version}/build/pdf.worker.min.js\`;
    }`
);

fs.writeFileSync('src/utils/pdfRenderer.ts', code);
