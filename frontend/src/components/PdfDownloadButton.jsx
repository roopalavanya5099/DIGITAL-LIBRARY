// src/components/PdfDownloadButton.jsx

import React from "react";

const PdfDownloadButton = ({ filename }) => {
  const handleDownload = () => {
    if (!filename) {
      alert("File not available");
      return;
    }

    // filename from backend must start with /uploads/xyz.pdf
    const fileUrl = `http://localhost:8000${filename}`;
    const fileNameOnly = filename.split("/").pop() || "file.pdf";

    // ✅ Create <a> element programmatically for direct download
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileNameOnly; // forces download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleDownload} className="download-btn">
      ⬇️ Download
    </button>
  );
};

export default PdfDownloadButton;