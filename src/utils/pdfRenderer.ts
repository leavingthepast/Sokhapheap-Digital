import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Use unpkg or cdnjs or local worker for reliable bundling without worker loader issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface RenderedPdfPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render all or specific pages of a PDF from base64 dataUrl, ArrayBuffer, or URL into crisp image data URLs.
 * Works seamlessly on iOS Safari, Android Chrome, and all desktop browsers.
 */
export async function renderPdfToImages(
  pdfSource: string | ArrayBuffer,
  maxPages = 10,
  scale = 1.5
): Promise<RenderedPdfPage[]> {
  try {
    let loadingTask;
    if (typeof pdfSource === 'string') {
      if (pdfSource.startsWith('data:')) {
        const base64Data = pdfSource.split(',')[1] || '';
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
      } else {
        loadingTask = pdfjsLib.getDocument({ url: pdfSource });
      }
    } else {
      loadingTask = pdfjsLib.getDocument({ data: pdfSource });
    }

    const pdf = await loadingTask.promise;
    const numPages = Math.min(pdf.numPages, maxPages);
    const pages: RenderedPdfPage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      pages.push({
        pageNumber: pageNum,
        dataUrl,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return pages;
  } catch (error) {
    console.error('Error rendering PDF:', error);
    return [];
  }
}
