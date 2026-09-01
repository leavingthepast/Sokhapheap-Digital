import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  Loader2, 
  Maximize2, 
  Download,
  AlertCircle
} from 'lucide-react';
import { renderPdfToImages, RenderedPdfPage } from '../utils/pdfRenderer';

interface PdfViewerProps {
  pdfUrl: string;
  fileName?: string;
  className?: string;
  initialScale?: number;
  showControls?: boolean;
  compact?: boolean;
  onOpenFull?: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  fileName = 'document.pdf',
  className = '',
  initialScale = 1.0,
  showControls = true,
  compact = false,
  onOpenFull,
}) => {
  const [pages, setPages] = useState<RenderedPdfPage[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(initialScale);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadPdf() {
      if (!pdfUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Render up to 20 pages with high quality scale
        const rendered = await renderPdfToImages(pdfUrl, 20, 2.0);
        if (isMounted) {
          if (rendered && rendered.length > 0) {
            setPages(rendered);
            setCurrentPage(1);
          } else {
            setError('Could not render PDF pages. The file may be corrupt or encrypted.');
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('PDF view error:', err);
          setError('Failed to process PDF document.');
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  const activePage = pages.find((p) => p.pageNumber === currentPage) || pages[0];

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1.0);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  if (loading) {
    return (
      <div className={`w-full flex flex-col items-center justify-center p-8 bg-slate-50/80 rounded-2xl border border-slate-200 min-h-[260px] ${className}`}>
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-800">Rendering PDF Document...</span>
        <span className="text-[11px] text-slate-500 mt-1">Generating crisp, mobile-optimized pages</span>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className={`w-full flex flex-col items-center justify-center p-6 bg-rose-50/60 rounded-2xl border border-rose-200 min-h-[220px] text-center ${className}`}>
        <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
        <span className="text-xs font-bold text-rose-900 mb-1">{error || 'Unable to preview PDF.'}</span>
        <p className="text-[11px] text-slate-600 max-w-sm mb-4">
          You can still download or open the file directly in your browser's native viewer.
        </p>
        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            download={fileName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-800 text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </a>
        </div>
      </div>
    );
  }

  // Compact Mode (for upload previews inside modal)
  if (compact) {
    return (
      <div className={`w-full flex flex-col bg-white rounded-xl border border-teal-200 overflow-hidden shadow-2xs ${className}`}>
        {/* Compact Header Bar */}
        <div className="px-3 py-2 bg-teal-50/90 border-b border-teal-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-rose-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              PDF
            </div>
            <span className="font-bold text-slate-900 truncate text-[11px]">{fileName}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {pages.length > 1 && (
              <span className="text-[10px] font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-full">
                Page {currentPage}/{pages.length}
              </span>
            )}
            {onOpenFull && (
              <button
                type="button"
                onClick={onOpenFull}
                className="p-1 hover:bg-teal-100 text-teal-800 rounded-md transition-colors"
                title="Expand Preview"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Preview Image Area */}
        <div className="relative bg-slate-100 overflow-hidden flex items-center justify-center p-2 min-h-[160px] max-h-[260px]">
          {activePage && (
            <img
              src={activePage.dataUrl}
              alt={`PDF Preview - Page ${currentPage}`}
              className="max-h-[240px] w-auto max-w-full object-contain rounded-md shadow-md bg-white transition-all border border-slate-200"
            />
          )}

          {/* Quick page switchers if multi-page */}
          {pages.length > 1 && (
            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between pointer-events-none">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => Math.max(p - 1, 1));
                }}
                className="pointer-events-auto p-1.5 rounded-full bg-white/90 shadow-md text-slate-700 hover:bg-white disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage >= pages.length}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => Math.min(p + 1, pages.length));
                }}
                className="pointer-events-auto p-1.5 rounded-full bg-white/90 shadow-md text-slate-700 hover:bg-white disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full Responsive View (for DocumentViewerModal & Doctor's View on Phones and Desktops)
  return (
    <div className={`w-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 ${className}`}>
      {/* Controls Header */}
      {showControls && (
        <div className="px-3 sm:px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-white">
          {/* Pagination Controls */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 py-0.5 bg-slate-900 rounded-md font-mono text-xs font-semibold text-teal-300">
              {currentPage} / {pages.length}
            </span>

            <button
              type="button"
              disabled={currentPage >= pages.length}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pages.length))}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700 transition-colors"
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
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
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
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors ml-1"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold text-slate-200 transition-colors"
              title="Reset Zoom"
            >
              Fit
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas / Image Area */}
      <div className="relative flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center bg-slate-950/90 min-h-[360px] max-h-[72vh] touch-pan-x touch-pan-y">
        {activePage && (
          <div 
            className="transition-transform duration-150 origin-center bg-white shadow-2xl rounded-lg overflow-hidden max-w-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={activePage.dataUrl}
              alt={`Page ${currentPage} of ${fileName}`}
              className="w-auto h-auto max-w-full max-h-[68vh] object-contain select-none pointer-events-none"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Page Thumbnails Bar for Multi-page Documents */}
      {pages.length > 1 && (
        <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          {pages.map((p) => (
            <button
              key={p.pageNumber}
              type="button"
              onClick={() => setCurrentPage(p.pageNumber)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all shrink-0 h-12 w-9 bg-white ${
                currentPage === p.pageNumber
                  ? 'border-teal-400 ring-2 ring-teal-400/40 scale-105'
                  : 'border-slate-700 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={p.dataUrl}
                alt={`Thumb ${p.pageNumber}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] font-mono text-center">
                {p.pageNumber}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
