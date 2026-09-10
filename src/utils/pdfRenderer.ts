import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker reliably with local asset priority to avoid external CDN timeouts or CORS failures
if (typeof window !== 'undefined') {
  try {
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
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
 * Load PDF Document safely from dataUrl base64, Uint8Array, ArrayBuffer, or URL.
 */
export async function loadPdfDocument(pdfSource: string | ArrayBuffer | Uint8Array) {
  const version = pdfjsLib.version || '6.3.289';
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
      return pdfjsLib.getDocument({
        data: bytes.buffer,
        cMapUrl,
        cMapPacked: true,
        standardFontDataUrl,
      }).promise;
    } else {
      return pdfjsLib.getDocument({
        url: pdfSource,
        cMapUrl,
        cMapPacked: true,
        standardFontDataUrl,
      }).promise;
    }
  } else {
    return pdfjsLib.getDocument({
      data: pdfSource,
      cMapUrl,
      cMapPacked: true,
      standardFontDataUrl,
    }).promise;
  }
}

/**
 * Render a single PDF page directly onto an HTML5 canvas element.
 * Scales dynamically to container width with High-DPI support to ensure crisp rendering
 * and prevent blank white screens on mobile devices.
 */
export function renderPdfPageToCanvas(
  page: any,
  canvas: HTMLCanvasElement,
  targetWidth: number,
  zoom = 1.0,
  rotation = 0
) {
  const baseRotation = ((page.rotate || 0) + rotation) % 360;
  const unscaledViewport = page.getViewport({ scale: 1.0, rotation: baseRotation });

  // Calculate fit-to-width scale
  const safeTargetWidth = Math.max(targetWidth || 320, 240);
  const fitScale = safeTargetWidth / unscaledViewport.width;
  const totalScale = fitScale * zoom;

  // DPR for high-density Retina/mobile screens
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const renderScale = totalScale * dpr;
  const viewport = page.getViewport({ scale: renderScale, rotation: baseRotation });

  // Canvas internal buffer size
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Canvas CSS display style for responsive container fit
  const cssWidth = Math.floor(viewport.width / dpr);
  const cssHeight = Math.floor(viewport.height / dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  const renderContext: any = {
    canvasContext: context,
    canvas: canvas,
    viewport: viewport,
  };

  const renderTask = page.render(renderContext);
  return {
    promise: renderTask.promise.then(() => ({
      width: cssWidth,
      height: cssHeight,
      scale: totalScale,
    })),
    cancel: () => {
      try {
        renderTask.cancel();
      } catch {
        // ignore cancellation
      }
    },
  };
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
    const pdf = await loadPdfDocument(pdfSource);
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

      const renderContext: any = {
        canvasContext: context,
        canvas: canvas,
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

