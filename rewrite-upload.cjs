const fs = require('fs');
let code = fs.readFileSync('src/utils/fileUpload.ts', 'utf8');

// We completely remove the server disk upload fallback so it relies strictly on Supabase or Data URIs.
// This guarantees that files uploaded locally are 100% portable to Vercel.

const startPattern = `  // 1. Primary: Upload to persistent server disk storage (/api/upload)`;
const endPattern = `  // 2. Secondary: Attempt Supabase Storage`;

const startIdx = code.indexOf(startPattern);
const endIdx = code.indexOf(endPattern);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx);
  fs.writeFileSync('src/utils/fileUpload.ts', code);
  console.log("Replaced!");
} else {
  console.log("Could not find patterns", {startIdx, endIdx});
}
