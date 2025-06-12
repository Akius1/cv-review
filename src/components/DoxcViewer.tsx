// Example: @/components/DocxViewer.tsx
import React, { useEffect, useRef } from "react";
import { renderAsync } from "docx-preview"; // npm install docx-preview

interface DocxViewerProps {
  fileUrl: string; // This would be a direct URL or a Blob
}

const DocxViewer: React.FC<DocxViewerProps> = ({ fileUrl }) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fileUrl && viewerRef.current) {
      // Fetch the docx file as a blob
      fetch(fileUrl)
        .then((response) => response.blob())
        .then((blob) => {
          renderAsync(blob, viewerRef.current!)
            .then(() => console.log("DOCX rendered"))
            .catch((error) => console.error("Error rendering DOCX:", error));
        })
        .catch((error) => console.error("Error fetching DOCX blob:", error));
    }
  }, [fileUrl]);

  return (
    <div ref={viewerRef} className="p-4 bg-white h-full overflow-auto"></div>
  );
};
export default DocxViewer;
