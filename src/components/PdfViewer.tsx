import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { loadPdfDocument, renderPdfPageToCanvas } from '../utils/pdfRenderer';

interface PdfViewerProps {
  pdfUrl: string;
  fileName?: string;
  className?: string;
  initialScale?: number;
  showControls?: boolean;
  compact?: boolean;
  onOpenFull?: () => void;
  isRestrictedMode?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  fileName = 'document.pdf',
  className = '',
  initialScale = 1.0,
  showControls = true,
  compact = false,
  onOpenFull,
  isRestrictedMode = false,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderingPage, setRenderingPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(initialScale);
  const [rotation, setRotation] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRenderTaskRef = useRef<{ cancel: () => void } | null>(null);

  // Measure container width responsively for mobile and desktop screens
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const measured = containerRef.current.clientWidth;
        if (measured > 0) {
          setContainerWidth(measured);
        }
      } else if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth > 640 ? 640 : window.innerWidth - 32);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const timer = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  // Load PDF Document safely via PDF.js without raw links or iframes
  useEffect(() => {
    let isMounted = true;
    async function initPdf() {
      if (!pdfUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const doc = await loadPdfDocument(pdfUrl);
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages || 1);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('PDF load error:', err);
          setError(
            err?.message || 'Could not load PDF document. The file may be corrupt, protected, or an invalid format.'
          );
          setLoading(false);
        }
      }
    }

    initPdf();
    return () => {
      isMounted = false;
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
      }
    };
  }, [pdfUrl]);

  // Render current page directly to HTML5 Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      setRenderingPage(true);

      // Cancel any in-flight rendering task before starting a new one
      if (currentRenderTaskRef.current) {
        currentRenderTaskRef.current.cancel();
        currentRenderTaskRef.current = null;
      }

      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Available width inside container for mobile responsiveness
      const padding = compact ? 16 : (window.innerWidth < 640 ? 20 : 40);
      const targetWidth = Math.max(containerWidth - padding, 260);

      const renderOperation = renderPdfPageToCanvas(
        page,
        canvas,
        targetWidth,
        zoom,
        rotation
      );

      currentRenderTaskRef.current = renderOperation;
      await renderOperation.promise;
      setRenderingPage(false);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('Page render note:', err);
      }
      setRenderingPage(false);
    }
  }, [pdfDoc, currentPage, containerWidth, zoom, rotation, compact]);

  useEffect(() => {
    if (pdfDoc && !loading) {
      renderCurrentPage();
    }
  }, [pdfDoc, loading, renderCurrentPage]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1.0);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Prevent context menu (right click) on secure viewer
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Loading state
  if (loading) {
    return (
      <div 
        ref={containerRef}
        className={`w-full flex flex-col items-center justify-center p-8 bg-slate-900/90 text-slate-200 rounded-2xl border border-slate-800 min-h-[300px] select-none ${className}`}
        onContextMenu={handleContextMenu}
      >
        <Loader2 className="w-9 h-9 text-teal-400 animate-spin mb-3" />
        <span className="text-sm font-bold text-white">Rendering PDF to HTML5 Canvas...</span>
        <span className="text-xs text-slate-400 mt-1">Direct high-DPI canvas rendering for mobile & desktop</span>
      </div>
    );
  }

  // Error state - never render iframe or raw download link
  if (error || !pdfDoc) {
    return (
      <div 
        ref={containerRef}
        className={`w-full flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 text-center min-h-[260px] select-none ${className}`}
        onContextMenu={handleContextMenu}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">Document Display Notice</h4>
        <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
          {error || 'Unable to render the document on HTML5 canvas. Raw links and iframes are strictly disabled for security.'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLoading(true);
              setPdfDoc(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Canvas Render</span>
          </button>
        </div>
      </div>
    );
  }

  // Compact Mode (for upload previews inside modal)
  if (compact) {
    return (
      <div 
        ref={containerRef}
        className={`w-full flex flex-col bg-slate-900 rounded-xl border border-teal-800/60 overflow-hidden shadow-md select-none ${className}`}
        onContextMenu={handleContextMenu}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <div className="px-3 py-2 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="truncate font-semibold text-slate-200">{fileName}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 bg-slate-900 rounded font-mono text-[11px] text-teal-300">
              {currentPage} / {numPages}
            </span>
            {numPages > 1 && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {onOpenFull && (
              <button
                type="button"
                onClick={onOpenFull}
                className="p-1 ml-1 rounded bg-teal-800/80 hover:bg-teal-700 text-teal-200 cursor-pointer"
                title="Open Full View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Canvas Display */}
        <div className="relative p-2 flex items-center justify-center bg-slate-950/80 min-h-[180px] max-h-[300px] overflow-auto">
          {renderingPage && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            draggable={false}
            onContextMenu={handleContextMenu}
            onDragStart={(e) => e.preventDefault()}
            className="max-w-full h-auto shadow-md rounded bg-white select-none pointer-events-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          />
        </div>
      </div>
    );
  }

  // Full Responsive View (for DocumentViewerModal & Doctor's View on Phones and Desktops)
  return (
    <div 
      ref={containerRef}
      className={`w-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 select-none ${className}`}
      onContextMenu={handleContextMenu}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Controls Header */}
      {showControls && (
        <div className="px-3 sm:px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-white">
          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 bg-slate-900 rounded-lg font-mono text-xs font-semibold text-teal-300 border border-slate-700/60">
              Page {currentPage} of {numPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom and Rotate Controls */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="px-2 py-0.5 font-mono text-xs text-slate-300">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors ml-1 cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Fit to Width"
            >
              Fit
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas Area - Direct HTML5 Canvas Rendering */}
      <div 
        className="relative flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-slate-950/95 min-h-[340px] max-h-[72vh] touch-pan-x touch-pan-y"
        onContextMenu={handleContextMenu}
      >
        {renderingPage && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 text-teal-300 text-xs px-2.5 py-1 rounded-full border border-teal-500/30 backdrop-blur-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Rendering Canvas...</span>
          </div>
        )}

        <div className="relative flex items-center justify-center max-w-full">
          {/* HTML5 Canvas Element */}
          <canvas
            ref={canvasRef}
            draggable={false}
            onContextMenu={handleContextMenu}
            onDragStart={(e) => e.preventDefault()}
            className="shadow-2xl rounded-lg bg-white select-none pointer-events-auto"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              display: 'block',
            }}
          />

          {/* View-Only Security Watermark Overlay */}
          {isRestrictedMode && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] select-none">
              <span className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-widest rotate-[-30deg]">
                VIEW-ONLY • PROTECTED CLINICAL DOCUMENT
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Multi-page Bottom Quick Bar */}
      {numPages > 1 && (
        <div className="px-3 py-2 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">
            {fileName} ({numPages} pages)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30 text-[11px] cursor-pointer"
            >
              Prev Page
            </button>
            <button
              type="button"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30 text-[11px] cursor-pointer"
            >
              Next Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
