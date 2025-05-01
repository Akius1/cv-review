"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
} from "lucide-react";

interface PDFViewerProps {
  fileUrl: string;
}

export default function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isWorkerInitialized, setIsWorkerInitialized] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Initialize the worker when the component mounts
  useEffect(() => {
    const version = pdfjs.version;
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
    setIsWorkerInitialized(true);
  }, []);

  // Responsive container width
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateContainerWidth();

    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateContainerWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateContainerWidth);
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error);
    setIsLoading(false);
    setError("Failed to load PDF. Please try again later.");
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      if (newPageNumber >= 1 && newPageNumber <= (numPages || 1)) {
        return newPageNumber;
      }
      return prevPageNumber;
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation((prev) => (prev + 90) % 360);

  const downloadPDF = () => {
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = "document.pdf";
      link.target = "_blank";
      link.click();
    }
  };

  if (!isWorkerInitialized) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-white rounded-lg shadow"
      ref={containerRef}
    >
      {/* PDF Toolbar */}
      <div className="bg-gray-50 px-4 py-2 flex flex-wrap items-center justify-between border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="text-sm font-medium text-gray-700">
            {pageNumber} / {numPages || 1}
          </div>

          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </button>

          <span className="text-sm font-medium text-gray-700">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={rotate}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Rotate"
          >
            <RotateCw className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={downloadPDF}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Download"
          >
            <Download className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4 relative min-h-96">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <p className="mt-2 text-gray-700">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900">
                Failed to load PDF
              </p>
              <p className="mt-1 text-gray-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            {numPages && pageNumber <= numPages && (
              <div className="transition-all duration-300 ease-in-out transform shadow-lg">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  width={Math.max(containerWidth * 0.8, 280)}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </div>
            )}
          </Document>
        </div>
      </div>

      {/* Mobile pagination controls (visible only on small screens) */}
      {numPages && numPages > 1 && (
        <div className="md:hidden bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center rounded-b-lg">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          <span className="text-sm font-medium text-gray-700">
            Page {pageNumber} of {numPages}
          </span>

          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
