import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker reliably across Safari (iOS/macOS) and Chrome (Android/Desktop)
if (typeof window !== 'undefined') {
  try {
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker setup note:', e);
  }
}

export interface RenderedPdfPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render all or specific pages of a PDF from base64 dataUrl, ArrayBuffer, or URL into crisp image data URLs.
 * Works seamlessly on iOS Safari, macOS Safari, Android Chrome, and Desktop Chrome.
 */
export async function renderPdfToImages(
  pdfSource: string | ArrayBuffer,
  maxPages = 20,
  scale = 2.0
): Promise<RenderedPdfPage[]> {
  try {
    let loadingTask;
    const version = pdfjsLib.version || '4.10.38';
    const cMapUrl = `https://unpkg.com/pdfjs-dist@${version}/cmaps/`;
    const standardFontDataUrl = `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`;

    if (typeof pdfSource === 'string') {
      if (pdfSource.startsWith('data:')) {
        const parts = pdfSource.split(',');
        const base64Data = parts[1] || parts[0];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        loadingTask = pdfjsLib.getDocument({
          data: bytes.buffer,
          cMapUrl,
          cMapPacked: true,
          standardFontDataUrl,
        });
      } else {
        loadingTask = pdfjsLib.getDocument({
          url: pdfSource,
          cMapUrl,
          cMapPacked: true,
          standardFontDataUrl,
        });
      }
    } else {
      loadingTask = pdfjsLib.getDocument({
        data: pdfSource,
        cMapUrl,
        cMapPacked: true,
        standardFontDataUrl,
      });
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

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
