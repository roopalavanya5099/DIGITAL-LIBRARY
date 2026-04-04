import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "./BookReader.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const API_BASE = "http://localhost:8000/api";

function BookReader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const [book, setBook] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [savedPage, setSavedPage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState("");
  const [popupShown, setPopupShown] = useState(false);

  const [showResumePopup, setShowResumePopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);

  const pageRefs = useRef([]);

  const fetchBook = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/books`);
      const foundBook = Array.isArray(res.data)
        ? res.data.find((item) => item._id === bookId)
        : null;
      setBook(foundBook || null);
    } catch (error) {
      console.error("Error fetching book:", error);
      setBook(null);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  const fetchBookmark = useCallback(async () => {
    if (!token) {
      setSavedPage(null);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/bookmarks/${bookId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && res.data.pageNumber) {
        setSavedPage(res.data.pageNumber);
      } else {
        setSavedPage(null);
      }
    } catch (error) {
      console.error("Error fetching bookmark:", error);
      setSavedPage(null);
    }
  }, [bookId, token]);

  useEffect(() => {
    fetchBook();
    fetchBookmark();
  }, [fetchBook, fetchBookmark]);

  const handleSaveBookmark = async (showAlert = true) => {
    if (!token) {
      if (showAlert) {
        alert("Please login to save bookmark");
      }
      return false;
    }

    try {
      await axios.post(
        `${API_BASE}/bookmarks/${bookId}`,
        { pageNumber: currentPage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSavedPage(currentPage);

      if (showAlert) {
        alert(`Bookmark saved at page ${currentPage}`);
      }

      return true;
    } catch (error) {
      console.error("Error saving bookmark:", error);
      if (showAlert) {
        alert("Failed to save bookmark");
      }
      return false;
    }
  };

  const handleDeleteBookmark = async () => {
    if (!token) {
      alert("Please login to remove bookmark");
      return;
    }

    try {
      await axios.delete(`${API_BASE}/bookmarks/${bookId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSavedPage(null);
      alert("Bookmark removed successfully");
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      alert("Failed to remove bookmark");
    }
  };

  const handleBack = () => {
    setShowSavePopup(true);
  };

  const handleSaveAndExit = async () => {
    await handleSaveBookmark(false);
    setShowSavePopup(false);
    navigate("/user");
  };

  const handleExitWithoutSave = () => {
    setShowSavePopup(false);
    navigate("/user");
  };

  const scrollToPage = (page) => {
    const pageElement = pageRefs.current[page - 1];
    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setCurrentPage(page);
    }
  };

  const handleResume = () => {
    if (savedPage) {
      scrollToPage(savedPage);
    }
    setShowResumePopup(false);
  };

  const handleStartOver = () => {
    scrollToPage(1);
    setShowResumePopup(false);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages);

    if (!popupShown) {
      if (savedPage && savedPage >= 1) {
        setTimeout(() => {
          setShowResumePopup(true);
          setPopupShown(true);
        }, 300);
      } else {
        setPopupShown(true);
      }
    }
  };

  const onDocumentLoadError = (error) => {
    console.error("PDF load error:", error);
    setPdfError("Failed to load PDF file.");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!pageRefs.current.length) return;

      let closestPage = 1;
      let smallestDistance = Infinity;

      pageRefs.current.forEach((pageEl, index) => {
        if (!pageEl) return;

        const rect = pageEl.getBoundingClientRect();
        const distance = Math.abs(rect.top - 120);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestPage = index + 1;
        }
      });

      setCurrentPage(closestPage);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [numPages]);

  if (loading) {
    return <div className="reader-container">Loading...</div>;
  }

  if (!book) {
    return <div className="reader-container">Book not found</div>;
  }

  return (
    <div className="reader-container">
      <div className="reader-topbar">
        <button className="back-btn" onClick={handleBack} type="button">
          ← Back
        </button>

        <div className="reader-topbar-right">
          <span className="page-count">
            Page {currentPage} of {numPages || "..."}
          </span>
        </div>
      </div>

      <h2 className="reader-title">{book.title}</h2>
      <p className="reader-author">by {book.author}</p>

      {savedPage ? (
        <p className="bookmark-info">Saved bookmark: Page {savedPage}</p>
      ) : (
        <p className="bookmark-info">No saved bookmark yet</p>
      )}

      <div className="reader-actions">
        <button onClick={() => handleSaveBookmark(true)} type="button">
          Save Bookmark
        </button>
        <button onClick={handleDeleteBookmark} type="button">
          Remove Bookmark
        </button>
      </div>

      <div className="pdf-wrapper">
        {pdfError ? (
          <p>{pdfError}</p>
        ) : (
          <Document
            file={`http://localhost:8000${book.fileUrl}`}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<p>Loading PDF...</p>}
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                className="pdf-page"
                ref={(el) => {
                  pageRefs.current[index] = el;
                }}
              >
                <Page
                  pageNumber={index + 1}
                  width={700}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading=""
                />
                <div className="pdf-page-number">Page {index + 1}</div>
              </div>
            ))}
          </Document>
        )}
      </div>

      {showResumePopup && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>📖 Resume Reading</h3>
            <p>You have a bookmark at page {savedPage}</p>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleResume} type="button">
                Resume
              </button>
              <button className="btn-secondary" onClick={handleStartOver} type="button">
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {showSavePopup && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>💾 Save Bookmark?</h3>
            <p>Save current page {currentPage} before leaving?</p>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveAndExit} type="button">
                Save & Exit
              </button>
              <button
                className="btn-danger"
                onClick={handleExitWithoutSave}
                type="button"
              >
                Exit Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookReader;