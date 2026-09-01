/**
 * Utility to reliably print medical documents and summaries across all browsers and iframes.
 */

export const triggerPrintDocument = (elementId: string, docTitle: string = 'Medical_Summary'): boolean => {
  try {
    const targetEl = document.getElementById(elementId);
    if (!targetEl) {
      window.print();
      return true;
    }

    // Try popup window print first (bypasses iframe sandboxes)
    const printWindow = window.open('', '_blank', 'width=950,height=1050,menubar=no,toolbar=no,location=no,status=no');
    
    if (printWindow) {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

      const contentHtml = targetEl.outerHTML;

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${docTitle}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Kantumruy+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
            ${styles}
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 12px !important;
                font-family: 'Plus Jakarta Sans', 'Kantumruy Pro', sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              #medical-summary-pdf-sheet {
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                width: 100% !important;
                max-width: 820px !important;
                margin: 0 auto !important;
                background: #ffffff !important;
              }
            </style>
          </head>
          <body>
            <div style="text-align: right; margin-bottom: 12px;" class="no-print">
              <button onclick="window.print()" style="padding: 8px 16px; background: #0d9488; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
                🖨️ Print Now / Save as PDF
              </button>
            </div>
            ${contentHtml}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 350);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      return true;
    } else {
      // If popup was blocked by browser, trigger standard window.print()
      window.print();
      return true;
    }
  } catch (err) {
    console.error('Print trigger error, falling back to window.print():', err);
    window.print();
    return false;
  }
};

export const downloadHtmlSummary = (elementId: string, fileName: string = 'Medical_Summary.html') => {
  const targetEl = document.getElementById(elementId);
  if (!targetEl) return;

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sokhapheap Digital - Medical Summary</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
  ${styles}
  <style>
    body { background: #f8fafc; padding: 24px; font-family: 'Plus Jakarta Sans', 'Kantumruy Pro', sans-serif; }
    #medical-summary-pdf-sheet { max-width: 820px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
  </style>
</head>
<body>
  ${targetEl.outerHTML}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
