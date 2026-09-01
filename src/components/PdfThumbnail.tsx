import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { renderPdfToImages } from '../utils/pdfRenderer';

interface PdfThumbnailProps {
  pdfUrl?: string;
  className?: string;
  fallbackIconSize?: string;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  pdfUrl,
  className = 'w-full h-full',
}) => {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!pdfUrl) return;

    async function loadThumb() {
      try {
        // Render only first page at small scale for fast lightweight thumbnail
        const pages = await renderPdfToImages(pdfUrl!, 1, 0.6);
        if (isMounted && pages && pages.length > 0 && pages[0].dataUrl) {
          setThumbnailSrc(pages[0].dataUrl);
        }
      } catch (err) {
        console.debug('Failed to generate PDF thumbnail:', err);
      }
    }

    loadThumb();
    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  if (thumbnailSrc) {
    return (
      <img
        src={thumbnailSrc}
        alt="PDF Document Preview"
        className={`w-full h-full object-cover object-top ${className}`}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-rose-50 text-rose-600 text-center">
      <FileText className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 text-rose-600" />
      <span className="text-[9px] font-extrabold bg-rose-600 text-white px-1.5 py-0.2 rounded shadow-2xs">
        PDF
      </span>
    </div>
  );
};
