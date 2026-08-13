"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Loader2Icon,
  RotateCw,
  ZoomInIcon,
  ZoomOutIcon,
  AlertCircleIcon,
} from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewProps {
  url: string;
}

function PdfView({ url }: PdfViewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [file, setFile] = useState<Blob | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the PDF from the URL
  useEffect(() => {
    const fetchFile = async () => {
      if (!url) {
        setError("No PDF URL provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("--- Fetching PDF from URL:", url);

        const response = await fetch(url, {
          headers: {
            Accept: "application/pdf",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch PDF: ${response.status} ${response.statusText}`
          );
        }

        const fileBlob = await response.blob();

        if (fileBlob.size === 0) {
          throw new Error("PDF file is empty (0 bytes)");
        }

        console.log(`--- PDF loaded: ${fileBlob.size} bytes`);
        setFile(fileBlob);
      } catch (err) {
        console.error("--- Error loading PDF:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setFile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [url]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    console.log(`--- PDF has ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("--- PDF document load error:", error);
    setError(`Failed to render PDF: ${error.message}`);
  };

  // Reset when URL changes
  useEffect(() => {
    setNumPages(null);
    setPageNumber(1);
  }, [url]);

  return (
    <div className="flex flex-col justify-center items-center w-full">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-gray-100 p-2 rounded-b-lg w-full">
        <div className="max-w-6xl mx-auto px-2 grid grid-cols-6 gap-2 items-center">
          <Button
            variant="outline"
            disabled={pageNumber === 1 || !numPages}
            onClick={() => {
              if (pageNumber > 1) {
                setPageNumber(pageNumber - 1);
              }
            }}
          >
            Previous
          </Button>

          <p className="flex items-center justify-center text-sm">
            {numPages ? `${pageNumber} of ${numPages}` : "Loading..."}
          </p>

          <Button
            variant="outline"
            disabled={pageNumber === numPages || !numPages}
            onClick={() => {
              if (numPages && pageNumber < numPages) {
                setPageNumber(pageNumber + 1);
              }
            }}
          >
            Next
          </Button>

          <Button
            variant="outline"
            onClick={() => setRotation((rotation + 90) % 360)}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            disabled={scale >= 1.5}
            onClick={() => setScale(Math.min(scale * 1.2, 1.5))}
          >
            <ZoomInIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            disabled={scale <= 0.5}
            onClick={() => setScale(Math.max(scale / 1.2, 0.5))}
          >
            <ZoomOutIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2Icon className="animate-spin h-16 w-16 text-indigo-600" />
          <p className="mt-4 text-gray-600">Loading PDF...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center h-96 max-w-md mx-auto p-6">
          <div className="mb-4 p-4 border border-red-500 bg-red-50 rounded-lg text-red-700 w-full">
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to load PDF</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Try uploading the PDF again or refresh the page.
          </p>
        </div>
      )}

      {/* PDF Viewer */}
      {!loading && !error && file && (
        <Document
          file={file}
          rotate={rotation}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="m-4 overflow-scroll w-full flex justify-center"
          loading={
            <div className="flex items-center justify-center h-96">
              <Loader2Icon className="animate-spin h-12 w-12 text-indigo-600" />
            </div>
          }
        >
          <Page
            className="shadow-lg rounded-lg"
            scale={scale}
            pageNumber={pageNumber}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      )}

      {/* No PDF */}
      {!loading && !error && !file && (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <p>No PDF to display</p>
        </div>
      )}
    </div>
  );
}

export default PdfView;