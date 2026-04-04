import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  FaHeart,
  FaSearch,
  FaBook,
  FaDownload,
  FaUserCircle,
  FaTimes,
  FaEdit,
} from "react-icons/fa";
import "./UserDashboard.css";
import LoginPopup from "../components/LoginPopup";

function User() {
  const navigate = useNavigate();
  const { userName, userRole, logout } = useContext(AuthContext);

  const isGuest = userRole === "guest";
  const token = localStorage.getItem("authToken");
  const currentUserId = localStorage.getItem("userId");

  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState("All");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const [reviewInputs, setReviewInputs] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/books");
      const safeBooks = Array.isArray(res.data)
        ? res.data.filter((book) => book && typeof book === "object")
        : [];
      setBooks(safeBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
      setBooks([]);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const fetchFavorites = useCallback(async () => {
    if (!token || isGuest) return;

    try {
      const res = await axios.get("http://localhost:8000/api/users/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const safeFavorites = Array.isArray(res.data)
        ? res.data.filter((book) => book && typeof book === "object")
        : [];

      setFavorites(safeFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavorites([]);
    }
  }, [token, isGuest]);

  const fetchDownloads = useCallback(async () => {
    if (!token || isGuest) return;

    try {
      const res = await axios.get("http://localhost:8000/api/users/downloads", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const safeDownloads = Array.isArray(res.data)
        ? res.data.filter((book) => book && typeof book === "object")
        : [];

      setDownloads(safeDownloads);
    } catch (error) {
      console.error("Error fetching downloads:", error);
      setDownloads([]);
    }
  }, [token, isGuest]);

  useEffect(() => {
    if (!isGuest && token) {
      fetchFavorites();
      fetchDownloads();
    }
  }, [token, isGuest, fetchFavorites, fetchDownloads]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowCategoryDropdown(false);
      setShowLanguageDropdown(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFavorite = async (book) => {
    if (!book?._id) return;

    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }

    try {
      const isFav = favorites.some(
        (fav) => fav?._id?.toString() === book?._id?.toString()
      );

      if (isFav) {
        await axios.delete(`http://localhost:8000/api/users/favorite/${book._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `http://localhost:8000/api/users/favorite/${book._id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      await fetchFavorites();
      await fetchBooks();
    } catch (error) {
      console.error("Favorite error:", error);
      alert(error.response?.data?.message || "Favorite error");
    }
  };

  const handleView = (book) => {
    if (!book?._id) return;

    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }

    navigate(`/read/${book._id}`);
  };

  const handleDownload = async (book) => {
    if (!book) return;

    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }

    try {
      const filename = book.fileUrl?.split("/").pop();

      if (!filename) {
        alert("File not found");
        return;
      }

      const response = await axios.get(`http://localhost:8000/download/${filename}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchDownloads();
      await fetchBooks();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${book.title || "book"}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(err.response?.data?.message || "Download failed");
    }
  };

  const handleReviewInputChange = (bookId, field, value) => {
    setReviewInputs((prev) => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        [field]: value,
      },
    }));
  };

  const submitRating = async (bookId, ratingValue) => {
    if (!bookId) return;

    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }

    try {
      await axios.post(
        `http://localhost:8000/api/books/${bookId}/rate`,
        { rating: ratingValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setReviewInputs((prev) => ({
        ...prev,
        [bookId]: {
          ...prev[bookId],
          rating: ratingValue,
        },
      }));

      await fetchBooks();

      if (selectedBook && selectedBook._id === bookId) {
        const res = await axios.get(`http://localhost:8000/api/books/${bookId}`);
        const updatedBook = res.data || null;
        setSelectedBook(updatedBook);

        const existingReview =
          updatedBook?.reviews?.find(
            (review) =>
              review?.user?._id?.toString() === currentUserId ||
              review?.user?.toString() === currentUserId
          ) || null;

        setReviewInputs((prev) => ({
          ...prev,
          [bookId]: {
            rating: existingReview?.rating || ratingValue,
            comment: prev[bookId]?.comment ?? existingReview?.comment ?? "",
          },
        }));
      }
    } catch (error) {
      console.error("Rating error:", error);
      alert(error.response?.data?.message || "Rating failed");
    }
  };

  const handleBookClick = async (book) => {
    if (!book?._id) return;

    try {
      const res = await axios.get(`http://localhost:8000/api/books/${book._id}`);
      const fullBook = res.data;

      if (!fullBook || typeof fullBook !== "object") {
        setSelectedBook(book);
        setIsEditingReview(false);
        return;
      }

      setSelectedBook(fullBook);

      const existingReview =
        fullBook?.reviews?.find(
          (review) =>
            review?.user?._id?.toString() === currentUserId ||
            review?.user?.toString() === currentUserId
        ) || null;

      setReviewInputs((prev) => ({
        ...prev,
        [book._id]: {
          rating: existingReview?.rating || "",
          comment: existingReview?.comment || "",
        },
      }));

      setIsEditingReview(false);
    } catch (error) {
      console.error("Error fetching single book:", error);
      setSelectedBook(book || null);
      setIsEditingReview(false);
    }
  };

  const closeBookModal = () => {
    setSelectedBook(null);
    setIsEditingReview(false);
  };

  const submitReview = async (bookId) => {
    if (!bookId) return;

    if (isGuest) {
      setShowLoginPopup(true);
      return;
    }

    const currentReview = reviewInputs[bookId] || {};
    const rating = Number(currentReview.rating);
    const comment = currentReview.comment?.trim();

    if (!rating || rating < 1 || rating > 5) {
      alert("Please select rating in the description card");
      return;
    }

    if (!comment) {
      alert("Please write your review");
      return;
    }

    try {
      setSubmittingReview(true);

      const res = await axios.post(
        `http://localhost:8000/api/books/${bookId}/review`,
        { rating, comment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedBook = res.data?.book;

      if (updatedBook) {
        setBooks((prevBooks) =>
          prevBooks.map((book) => (book?._id === bookId ? updatedBook : book))
        );

        setSelectedBook(updatedBook);

        const existingReview =
          updatedBook?.reviews?.find(
            (review) =>
              review?.user?._id?.toString() === currentUserId ||
              review?.user?.toString() === currentUserId
          ) || null;

        setReviewInputs((prev) => ({
          ...prev,
          [bookId]: {
            rating: existingReview?.rating || rating,
            comment: existingReview?.comment || "",
          },
        }));
      }

      setIsEditingReview(false);
      alert(res.data?.message || "Review submitted successfully");
    } catch (error) {
      console.error("Review submit error:", error);
      alert(error.response?.data?.message || "Review submit failed");
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredBooks = books.filter((book) => {
    if (!book || typeof book !== "object") return false;

    const title = book?.title?.toLowerCase() || "";
    const author = book?.author?.toLowerCase() || "";
    const description = book?.description?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      title.includes(search) ||
      author.includes(search) ||
      description.includes(search);

    const matchesCategory = category === "All" || book?.category === category;
    const matchesLanguage = language === "All" || book?.language === language;

    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const categoryOptions = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        books
          .filter((book) => book && typeof book === "object")
          .map((book) => book.category)
          .filter(Boolean)
      ),
    ];
    return ["All", ...uniqueCategories];
  }, [books]);

  const languageOptions = useMemo(() => {
    const uniqueLanguages = [
      ...new Set(
        books
          .filter((book) => book && typeof book === "object")
          .map((book) => book.language)
          .filter(Boolean)
      ),
    ];
    return ["All", ...uniqueLanguages];
  }, [books]);

  const totalBooks = books.filter((book) => book && typeof book === "object").length;
  const totalFavorites = favorites.filter((book) => book && typeof book === "object").length;
  const totalDownloads = downloads.filter((book) => book && typeof book === "object").length;
  const categoriesCount = new Set(
    books
      .filter((book) => book && typeof book === "object")
      .map((book) => book.category)
      .filter(Boolean)
  ).size;

  return (
    <div className="dashboard-container">
      <div className="dashboard-nav">
        <h1>Digital Library</h1>

        <div className="nav-actions">
          <div className="user-welcome-chip">
            <FaUserCircle />
            <span>Welcome, {isGuest ? "Guest" : userName || "User"}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="hero-section">
          <div className="hero-text">
            <h2>Explore Your Digital Library</h2>
            <p>
              Discover books, manage favorites, track downloads, rate your
              reading experience, and continue reading with bookmarks.
            </p>
          </div>

          <div className="hero-badge">
            <FaBook />
            <span>{totalBooks} Books Available</span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaBook />
            </div>
            <div>
              <h3>{totalBooks}</h3>
              <p>Total Books</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaHeart />
            </div>
            <div>
              <h3>{isGuest ? "—" : totalFavorites}</h3>
              <p>My Favorites</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaDownload />
            </div>
            <div>
              <h3>{isGuest ? "—" : totalDownloads}</h3>
              <p>My Downloads</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaSearch />
            </div>
            <div>
              <h3>{categoriesCount}</h3>
              <p>Categories</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header-row">
            <h2 className="books-title">Available Books</h2>
            <span className="results-count">
              {filteredBooks.length} result{filteredBooks.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="search-wrapper">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by title, author or description..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div
                className="custom-filter-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="custom-filter-btn"
                  onClick={() => {
                    setShowCategoryDropdown((prev) => !prev);
                    setShowLanguageDropdown(false);
                  }}
                >
                  <span>{category === "All" ? "All Categories" : category}</span>
                  <span className="dropdown-arrow">▾</span>
                </button>

                {showCategoryDropdown && (
                  <div className="custom-filter-menu">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {cat === "All" ? "All Categories" : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="custom-filter-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="custom-filter-btn"
                  onClick={() => {
                    setShowLanguageDropdown((prev) => !prev);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <span>{language === "All" ? "All Languages" : language}</span>
                  <span className="dropdown-arrow">▾</span>
                </button>

                {showLanguageDropdown && (
                  <div className="custom-filter-menu">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setLanguage(lang);
                          setShowLanguageDropdown(false);
                        }}
                      >
                        {lang === "All" ? "All Languages" : lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="books-grid">
            {filteredBooks.length > 0 ? (
              filteredBooks.filter(Boolean).map((book) => {
                const isFavorite = favorites.some(
                  (fav) => fav?._id?.toString() === book?._id?.toString()
                );

                return (
                  <div
                    key={book._id}
                    className="book-card"
                    onClick={() => handleBookClick(book)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleBookClick(book);
                      }
                    }}
                    title="Click to view description"
                  >
                    <div className="book-card-top">
                      <div className="book-title-rating-wrap">
                        <h3>{book?.title || "Untitled Book"}</h3>

                        <div className="book-title-stars static-rating-display">
                          <span className="single-rating-star">★</span>
                          <span className="single-rating-value">
                            {book?.averageRating ? book.averageRating.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>

                      <button
                        className={`heart-icon-btn ${isFavorite ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavorite(book);
                        }}
                        type="button"
                        title="Add to favorites"
                      >
                        <FaHeart />
                      </button>
                    </div>

                    <div className="book-meta">
                      <p>
                        <strong>Author:</strong> {book?.author || "Unknown"}
                      </p>
                      <p>
                        <strong>Category:</strong> {book?.category || "N/A"}
                      </p>
                      <p>
                        <strong>Language:</strong> {book?.language || "N/A"}
                      </p>
                    </div>

                    <div className="book-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="view-btn"
                        onClick={() => handleView(book)}
                        type="button"
                      >
                        🔖 Read
                      </button>

                      <button
                        className="download-btn"
                        onClick={() => handleDownload(book)}
                        type="button"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <FaBook className="empty-icon" />
                <h3>No books found</h3>
                <p>Try changing the search text, category or language filter.</p>
              </div>
            )}
          </div>
        </div>

        {!isGuest && (
          <div className="library-bottom-grid">
            <div className="section-card">
              <div className="section-header-row">
                <h2>My Favorites</h2>
                <span className="results-count">{totalFavorites} saved</span>
              </div>

              <div className="downloads-list">
                {favorites.filter(Boolean).length > 0 ? (
                  favorites.filter(Boolean).map((book) => (
                    <div key={book._id} className="download-item">
                      <p>
                        <strong>{book?.title || "Untitled Book"}</strong>
                      </p>
                      <p>{book?.author || "Unknown"}</p>
                    </div>
                  ))
                ) : (
                  <div className="mini-empty-state">
                    <p>No favorites yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="section-card">
              <div className="section-header-row">
                <h2>My Downloads</h2>
                <span className="results-count">{totalDownloads} downloaded</span>
              </div>

              <div className="downloads-list">
                {downloads.filter(Boolean).length > 0 ? (
                  downloads.filter(Boolean).map((book) => (
                    <div key={book._id} className="download-item">
                      <p>
                        <strong>{book?.title || "Untitled Book"}</strong>
                      </p>
                      <p>{book?.author || "Unknown"}</p>
                    </div>
                  ))
                ) : (
                  <div className="mini-empty-state">
                    <p>No downloads yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedBook && (
        <div className="book-modal-overlay" onClick={closeBookModal}>
          <div className="book-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="book-modal-close"
              onClick={closeBookModal}
              type="button"
            >
              <FaTimes />
            </button>

            <div className="book-modal-header">
              <h2>{selectedBook?.title || "Untitled Book"}</h2>
              <p className="book-modal-subtitle">
                by {selectedBook?.author || "Unknown Author"}
              </p>
            </div>

            <div className="book-modal-description">
              <h3>Description</h3>
              <p>
                {selectedBook?.description
                  ? selectedBook.description
                  : "No description available for this book."}
              </p>
            </div>

            <div className="book-modal-review-section">
              <h3>Rate & Review</h3>

              <div className="current-rating-info">
                <span className="current-rating-label">Your Rating:</span>

                <div className="modal-rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`modal-rate-star ${
                        star <= Number(reviewInputs[selectedBook?._id]?.rating || 0)
                          ? "filled"
                          : ""
                      }`}
                      onClick={() => {
                        handleReviewInputChange(selectedBook?._id, "rating", star);
                        submitRating(selectedBook?._id, star);
                      }}
                      title={`${star} star`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="book-modal-review-form">
                <textarea
                  placeholder="Write your review here..."
                  value={reviewInputs[selectedBook?._id]?.comment || ""}
                  onChange={(e) =>
                    handleReviewInputChange(selectedBook?._id, "comment", e.target.value)
                  }
                />

                <div className="review-form-actions">
                  <button
                    className="submit-review-btn"
                    onClick={() => submitReview(selectedBook?._id)}
                    type="button"
                    disabled={submittingReview}
                  >
                    {submittingReview
                      ? "Saving..."
                      : isEditingReview
                      ? "Update Review"
                      : "Submit Review"}
                  </button>

                  {isEditingReview && (
                    <button
                      type="button"
                      className="cancel-edit-btn"
                      onClick={() => setIsEditingReview(false)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="review-list-section">
                <h3>User Reviews</h3>

                {selectedBook?.reviews &&
                selectedBook.reviews.filter(
                  (item) => item && item.comment && item.comment.trim() !== ""
                ).length > 0 ? (
                  <div className="review-list">
                    {[...selectedBook.reviews]
                      .filter((item) => item && item.comment && item.comment.trim() !== "")
                      .sort(
                        (a, b) =>
                          new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
                      )
                      .map((review) => {
                        const isMyReview =
                          review?.user?._id?.toString() === currentUserId ||
                          review?.user?.toString() === currentUserId;

                        return (
                          <div key={review?._id} className="review-card-modern">
                            <div className="review-top">
                              <span className="review-user">
                                {review?.userName || "User"}
                              </span>

                              <div className="review-top-right">
                                <div className="review-stars-display">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`review-star ${
                                        star <= (review?.rating || 0) ? "filled" : ""
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>

                                {isMyReview && (
                                  <button
                                    type="button"
                                    className="edit-review-btn small-edit-btn"
                                    onClick={() => {
                                      setIsEditingReview(true);
                                      setReviewInputs((prev) => ({
                                        ...prev,
                                        [selectedBook._id]: {
                                          rating: review?.rating || "",
                                          comment: review?.comment || "",
                                        },
                                      }));
                                    }}
                                    title="Edit review"
                                  >
                                    <FaEdit />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="review-comment">
                              {review?.comment || "No comment"}
                            </p>

                            <span className="review-date">
                              {review?.createdAt
                                ? new Date(review.createdAt).toLocaleDateString()
                                : ""}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="mini-empty-state">
                    <p>No reviews yet. Be the first to review this book.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="book-modal-actions">
              <button
                className="view-btn"
                onClick={() => handleView(selectedBook)}
                type="button"
              >
                🔖 Read
              </button>

              <button
                className="download-btn"
                onClick={() => handleDownload(selectedBook)}
                type="button"
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

export default User;