import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  FaBook,
  FaUsers,
  FaDownload,
  FaStar,
  FaTrash,
  FaUserCircle,
  FaPlus,
  FaEye,
  FaSearch,
  FaArrowLeft,
} from "react-icons/fa";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:8000/api";

function Admin() {
  const navigate = useNavigate();
  const { userName, logout, authToken } = useContext(AuthContext);

  const [activeSection, setActiveSection] = useState(null);

  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDownloads, setLoadingDownloads] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
 // eslint-disable-next-line
const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [showAddBookForm, setShowAddBookForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [bookSort, setBookSort] = useState("latest");
  const [userSort, setUserSort] = useState("name-asc");

  const [showBookSortDropdown, setShowBookSortDropdown] = useState(false);
  const [showUserSortDropdown, setShowUserSortDropdown] = useState(false);

  const [activeDownloadCard, setActiveDownloadCard] = useState("history");
  const [activeReviewCard, setActiveReviewCard] = useState("allReviews");

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    category: "",
    language: "English",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const [newUser, setNewUser] = useState({
  name: "",
  email: "",
  password: "",
  role: "user",   // ✅ default
  rollNumber: "",
});

  const [analytics, setAnalytics] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalDownloads: 0,
    totalReviews: 0,
    totalFavorites: 0,
    topDownloadedBooks: [],
    activeUsers: [],
  });

  const authHeaders = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${authToken}` },
    }),
    [authToken]
  );

  const topRatedBooks = useMemo(() => {
    return books
      .filter(
        (book) =>
          book &&
          typeof book === "object" &&
          Number(book.averageRating) > 0
      )
      .sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0))
      .slice(0, 8)
      .map((book) => ({
        ...book,
        totalRatings:
          book.reviewCount ||
          (Array.isArray(book.reviews)
            ? book.reviews.filter(
                (item) => item?.comment && item.comment.trim() !== ""
              ).length
            : 0),
      }));
  }, [books]);

  const recentReviews = useMemo(() => reviews.slice(0, 8), [reviews]);

  const openSection = (section) => {
    setActiveSection(section);
    setSearchTerm("");
    setShowBookSortDropdown(false);
    setShowUserSortDropdown(false);

    if (section === "downloads") {
      setActiveDownloadCard("history");
    }

    if (section === "reviews") {
      setActiveReviewCard("allReviews");
    }
  };

  const goBackToOverview = () => {
    setActiveSection(null);
    setSearchTerm("");
    setShowBookSortDropdown(false);
    setShowUserSortDropdown(false);
  };

  const toggleDownloadCard = (card) => {
    setActiveDownloadCard((prev) => (prev === card ? null : card));
  };

  const toggleReviewCard = (card) => {
    setActiveReviewCard((prev) => (prev === card ? null : card));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleChangeBook = (e) => {
    const { name, value } = e.target;
    setNewBook((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeUser = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const loadAnalytics = useCallback(async () => {
    if (!authToken) return;
    setLoadingAnalytics(true);

    try {
      const res = await axios.get(`${API_BASE}/admin/analytics`, authHeaders);
      const data = res.data || {};

      setAnalytics({
        totalBooks: data.totalBooks || 0,
        totalUsers: data.totalUsers || 0,
        totalDownloads: data.totalDownloads || 0,
        totalReviews: data.totalReviews || 0,
        totalFavorites: data.totalFavorites || 0,
        topDownloadedBooks: Array.isArray(data.topDownloadedBooks)
          ? data.topDownloadedBooks
          : [],
        activeUsers: Array.isArray(data.activeUsers) ? data.activeUsers : [],
      });

      setDownloadHistory(Array.isArray(data.downloadHistory) ? data.downloadHistory : []);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setDownloadHistory([]);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [authHeaders, authToken]);

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const res = await axios.get(`${API_BASE}/books`);
      setBooks(Array.isArray(res.data) ? res.data.filter(Boolean) : []);
    } catch (error) {
      console.error("Error loading books:", error);
      setBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (!authToken) return;
    setLoadingUsers(true);

    try {
      const res = await axios.get(`${API_BASE}/admin/users`, authHeaders);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [authHeaders, authToken]);

  const loadDownloadsData = useCallback(async () => {
    if (!authToken) return;
    setLoadingDownloads(true);

    try {
      const res = await axios.get(`${API_BASE}/admin/analytics`, authHeaders);
      const data = res.data || {};

      setDownloadHistory(Array.isArray(data.downloadHistory) ? data.downloadHistory : []);

      setAnalytics((prev) => ({
        ...prev,
        totalDownloads: data.totalDownloads || 0,
        topDownloadedBooks: Array.isArray(data.topDownloadedBooks)
          ? data.topDownloadedBooks
          : [],
        activeUsers: Array.isArray(data.activeUsers) ? data.activeUsers : [],
      }));
    } catch (error) {
      console.error("Error loading downloads data:", error);
      setDownloadHistory([]);
    } finally {
      setLoadingDownloads(false);
    }
  }, [authHeaders, authToken]);

  const loadReviewsData = useCallback(async () => {
    if (!authToken) return;
    setLoadingReviews(true);

    try {
      const [reviewsRes, booksRes, analyticsRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/books/admin/all-reviews`, authHeaders),
        axios.get(`${API_BASE}/books`),
        axios.get(`${API_BASE}/admin/analytics`, authHeaders),
      ]);

      if (reviewsRes.status === "fulfilled") {
        const reviewData = Array.isArray(reviewsRes.value.data)
          ? reviewsRes.value.data.filter(Boolean)
          : [];
        setReviews(reviewData);
      } else {
        setReviews([]);
        console.error("Reviews route issue:", reviewsRes.reason);
      }

      if (booksRes.status === "fulfilled") {
        setBooks(Array.isArray(booksRes.value.data) ? booksRes.value.data.filter(Boolean) : []);
      } else {
        setBooks([]);
        console.error("Books route issue:", booksRes.reason);
      }

      if (analyticsRes.status === "fulfilled") {
        const data = analyticsRes.value.data || {};
        setAnalytics((prev) => ({
          ...prev,
          totalReviews: data.totalReviews || 0,
        }));
      }
    } catch (error) {
      console.error("Error loading reviews data:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [authHeaders, authToken]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (activeSection === "users") {
      loadUsers();
    }

    if (activeSection === "books") {
      loadBooks();
    }

    if (activeSection === "downloads") {
      loadDownloadsData();
    }

    if (activeSection === "reviews") {
      loadReviewsData();
    }
  }, [activeSection, loadBooks, loadUsers, loadDownloadsData, loadReviewsData]);

  const handleAddBook = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a PDF file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", newBook.title);
      formData.append("author", newBook.author);
      formData.append("category", newBook.category);
      formData.append("language", newBook.language);
      formData.append("description", newBook.description);
      formData.append("pdf", selectedFile);

      await axios.post(`${API_BASE}/books`, formData, authHeaders);

      alert("Book added successfully");
      setShowAddBookForm(false);
      setNewBook({
        title: "",
        author: "",
        category: "",
        language: "English",
        description: "",
      });
      setSelectedFile(null);

      await loadBooks();
      await loadAnalytics();
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(error.response?.data?.message || "Error adding book");
    }
  };

  const handleViewBook = (book) => {
    if (!book?.fileUrl) {
      alert("Book file not found");
      return;
    }

    window.open(`http://localhost:8000${book.fileUrl}`, "_blank");
  };

  const handleDeleteBook = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this book?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/books/${id}`, authHeaders);
      setBooks((prev) => prev.filter((book) => book._id !== id));
      await loadAnalytics();
      alert("Book deleted successfully");
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(error.response?.data?.message || "Error deleting book");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_BASE}/admin/users`, newUser, authHeaders);

      alert("User added successfully");
      setShowAddUserForm(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
        rollNumber: "",  
      });

      await loadUsers();
      await loadAnalytics();
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(error.response?.data?.message || "Error adding user");
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/admin/users/${id}`, authHeaders);
      setUsers((prev) => prev.filter((user) => user._id !== id));
      await loadAnalytics();
      alert("User deleted successfully");
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(error.response?.data?.message || "Error deleting user");
    }
  };

  const truncateDescription = (text, maxLength = 100) => {
    if (!text) return "No description added";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const getBookSortLabel = () => {
    switch (bookSort) {
      case "title-asc":
        return "Title A-Z";
      case "title-desc":
        return "Title Z-A";
      case "rating-high":
        return "Top Rated";
      case "downloads-high":
        return "Most Downloaded";
      case "latest":
      default:
        return "Latest";
    }
  };

  const getUserSortLabel = () => {
    switch (userSort) {
      case "name-desc":
        return "Name Z-A";
      case "email-asc":
        return "Email A-Z";
      case "email-desc":
        return "Email Z-A";
      case "role":
        return "Role";
      case "name-asc":
      default:
        return "Name A-Z";
    }
  };

  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let filtered = books.filter((book) => {
      if (!term) return true;

      return (
        book.title?.toLowerCase().includes(term) ||
        book.author?.toLowerCase().includes(term) ||
        book.category?.toLowerCase().includes(term) ||
        book.language?.toLowerCase().includes(term) ||
        book.description?.toLowerCase().includes(term)
      );
    });

    filtered = [...filtered].sort((a, b) => {
      switch (bookSort) {
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "rating-high":
          return Number(b.averageRating || 0) - Number(a.averageRating || 0);
        case "downloads-high":
          return Number(b.downloads || b.downloadCount || 0) - Number(a.downloads || a.downloadCount || 0);
        case "latest":
        default:
          return new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0);
      }
    });

    return filtered;
  }, [books, searchTerm, bookSort]);

 const filteredUsers = useMemo(() => {
  const term = searchTerm.trim().toLowerCase();

  let filtered = users.filter((user) => {
    if (!term) return true;

    return (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term) ||
      user.rollNumber?.toLowerCase().includes(term)   // ✅ added
    );
  });

    filtered = [...filtered].sort((a, b) => {
      switch (userSort) {
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "email-asc":
          return (a.email || "").localeCompare(b.email || "");
        case "email-desc":
          return (b.email || "").localeCompare(a.email || "");
        case "role":
          return (a.role || "").localeCompare(b.role || "");
        case "name-asc":
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

    return filtered;
  }, [users, searchTerm, userSort]);

  const renderSearchBar = (placeholder) => (
    <div className="admin-search-sort-row">
      <div className="admin-search-box">
        <FaSearch className="admin-search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />
      </div>

      {activeSection === "books" && (
        <div className="custom-dropdown">
          <button
            type="button"
            className="custom-dropdown-btn"
            onClick={() => {
              setShowBookSortDropdown((prev) => !prev);
              setShowUserSortDropdown(false);
            }}
          >
            <span>{getBookSortLabel()}</span>
            <span className="dropdown-arrow">▾</span>
          </button>

          {showBookSortDropdown && (
            <div className="custom-dropdown-menu">
              <button type="button" onClick={() => { setBookSort("latest"); setShowBookSortDropdown(false); }}>
                Latest
              </button>
              <button type="button" onClick={() => { setBookSort("title-asc"); setShowBookSortDropdown(false); }}>
                Title A-Z
              </button>
              <button type="button" onClick={() => { setBookSort("title-desc"); setShowBookSortDropdown(false); }}>
                Title Z-A
              </button>
              <button type="button" onClick={() => { setBookSort("rating-high"); setShowBookSortDropdown(false); }}>
                Top Rated
              </button>
              <button type="button" onClick={() => { setBookSort("downloads-high"); setShowBookSortDropdown(false); }}>
                Most Downloaded
              </button>
            </div>
          )}
        </div>
      )}

      {activeSection === "users" && (
        <div className="custom-dropdown">
          <button
            type="button"
            className="custom-dropdown-btn"
            onClick={() => {
              setShowUserSortDropdown((prev) => !prev);
              setShowBookSortDropdown(false);
            }}
          >
            <span>{getUserSortLabel()}</span>
            <span className="dropdown-arrow">▾</span>
          </button>

          {showUserSortDropdown && (
            <div className="custom-dropdown-menu">
              <button type="button" onClick={() => { setUserSort("name-asc"); setShowUserSortDropdown(false); }}>
                Name A-Z
              </button>
              <button type="button" onClick={() => { setUserSort("name-desc"); setShowUserSortDropdown(false); }}>
                Name Z-A
              </button>
              <button type="button" onClick={() => { setUserSort("email-asc"); setShowUserSortDropdown(false); }}>
                Email A-Z
              </button>
              <button type="button" onClick={() => { setUserSort("email-desc"); setShowUserSortDropdown(false); }}>
                Email Z-A
              </button>
              <button type="button" onClick={() => { setUserSort("role"); setShowUserSortDropdown(false); }}>
                Role
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-container admin-dashboard-clean">
      <div className="dashboard-nav admin-dashboard-nav">
        <div className="admin-nav-left">
          <h1>Digital Library Admin</h1>
          <p className="admin-nav-subtitle">Control users, books, downloads and reviews</p>
        </div>

        <div className="nav-actions">
          <div className="user-welcome-chip">
            <FaUserCircle />
            <span>Welcome, {userName || "Admin"}</span>
          </div>

          <button onClick={handleLogout} className="logout-btn" type="button">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content admin-dashboard-content">
        {!activeSection && (
          <>
            <div className="admin-hero-banner">
              <div>
                <h2>Admin Overview</h2>
                <p>Click any module card to open and manage its details.</p>
              </div>
            </div>

            <div className="admin-top-stats">
              <div
                className="admin-main-card"
                onClick={() => openSection("users")}
              >
                <div className="admin-card-icon">
                  <FaUsers />
                </div>
                <div className="admin-card-text">
                  <h3>Total Users</h3>
                  <p>Manage users and roles</p>
                </div>
              </div>

              <div
                className="admin-main-card"
                onClick={() => openSection("books")}
              >
                <div className="admin-card-icon">
                  <FaBook />
                </div>
                <div className="admin-card-text">
                  <h3>Total Books</h3>
                  <p>Add, organize and remove library books</p>
                </div>
              </div>

              <div
                className="admin-main-card"
                onClick={() => openSection("downloads")}
              >
                <div className="admin-card-icon">
                  <FaDownload />
                </div>
                <div className="admin-card-text">
                  <h3>Total Downloads</h3>
                  <p>Track reading activity and engagement</p>
                </div>
              </div>

              <div
                className="admin-main-card"
                onClick={() => openSection("reviews")}
              >
                <div className="admin-card-icon">
                  <FaStar />
                </div>
                <div className="admin-card-text">
                  <h3>Total Reviews</h3>
                  <p>Monitor ratings and reader feedback</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === "users" && (
          <div className="dashboard-section">
            <div className="section-topbar">
              <button type="button" className="back-btn" onClick={goBackToOverview}>
                <FaArrowLeft />
                Back
              </button>
            </div>

            <div className="section-card">
              <div className="section-header-row">
                <h2>Manage Users</h2>
                <span className="results-count">
                  {loadingUsers ? "Loading..." : `${filteredUsers.length} users`}
                </span>
              </div>

              <div className="admin-users-topbar">
                <button
                  onClick={() => setShowAddUserForm(true)}
                  className="add-btn"
                  type="button"
                >
                  <FaPlus style={{ marginRight: "8px" }} />
                  Add New User
                </button>
              </div>

              {renderSearchBar("Search by name, email, role, roll number...")}

              {loadingUsers ? (
                <div className="mini-empty-state">
                  <p>Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="mini-empty-state">
                  <p>No users found</p>
                  <small>Newly added users will appear here.</small>
                </div>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                         
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roll No</th>
                        <th>Role</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.rollNumber || "-"}</td>  
                          <td>
                            <span
                              className={`role-badge ${
                                user.role === "admin" ? "admin-role" : "user-role"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="delete-btn"
                              type="button"
                            >
                              <FaTrash style={{ marginRight: "6px" }} />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "books" && (
          <div className="dashboard-section">
            <div className="section-topbar">
              <button type="button" className="back-btn" onClick={goBackToOverview}>
                <FaArrowLeft />
                Back
              </button>
            </div>

            <div className="section-card">
              <div className="section-header-row">
                <h2>Manage Books</h2>
                <span className="results-count">
                  {loadingBooks ? "Loading..." : `${filteredBooks.length} books`}
                </span>
              </div>

              <div className="admin-users-topbar">
                <button
                  onClick={() => setShowAddBookForm(true)}
                  className="add-btn"
                  type="button"
                >
                  <FaPlus style={{ marginRight: "8px" }} />
                  Add New Book
                </button>
              </div>

              {renderSearchBar("Search books by title, author, category, language...")}

              {loadingBooks ? (
                <div className="empty-state">
                  <h3>Loading books...</h3>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="empty-state">
                  <FaBook className="empty-icon" />
                  <h3>No books available</h3>
                  <p>Add a new book to start building your library.</p>
                </div>
              ) : (
                <div className="books-grid admin-books-grid">
                  {filteredBooks.map((book) => (
                    <div key={book._id} className="book-card admin-book-card">
                      <div className="book-card-top">
                        <h3>{book.title}</h3>
                      </div>

                      <div className="book-meta">
                        <p>
                          <strong>Author:</strong> {book.author}
                        </p>
                        <p>
                          <strong>Category:</strong> {book.category}
                        </p>
                        <p>
                          <strong>Language:</strong> {book.language}
                        </p>
                        <p>
                          <strong>Description:</strong> {truncateDescription(book.description)}
                        </p>
                      </div>

                      <div className="admin-book-actions">
                        <button
                          onClick={() => handleViewBook(book)}
                          className="view-btn"
                          type="button"
                        >
                          <FaEye style={{ marginRight: "8px" }} />
                          View
                        </button>

                        <button
                          onClick={() => handleDeleteBook(book._id)}
                          className="delete-btn"
                          type="button"
                        >
                          <FaTrash style={{ marginRight: "8px" }} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "downloads" && (
          <div className="dashboard-section">
            <div className="section-topbar">
              <button type="button" className="back-btn" onClick={goBackToOverview}>
                <FaArrowLeft />
                Back
              </button>
            </div>

            <div className="section-title-wrap">
              <h2 className="dashboard-section-title">Downloads Control</h2>
              <p className="dashboard-section-subtitle">
                Click a card below to open the related download data
              </p>
            </div>

            <div className="admin-sub-cards-row">
              <div
                className={`admin-sub-card ${activeDownloadCard === "history" ? "active-sub-card" : ""}`}
                onClick={() => toggleDownloadCard("history")}
              >
                <div className="admin-sub-card-icon">
                  <FaDownload />
                </div>
                <div className="admin-sub-card-text">
                  <h3>Download History</h3>
                  <p>View all download records</p>
                </div>
              </div>

              <div
                className={`admin-sub-card ${activeDownloadCard === "activeUsers" ? "active-sub-card" : ""}`}
                onClick={() => toggleDownloadCard("activeUsers")}
              >
                <div className="admin-sub-card-icon">
                  <FaUsers />
                </div>
                <div className="admin-sub-card-text">
                  <h3>Active Readers</h3>
                  <p>See users with most downloads</p>
                </div>
              </div>

              <div
                className={`admin-sub-card ${activeDownloadCard === "topBooks" ? "active-sub-card" : ""}`}
                onClick={() => toggleDownloadCard("topBooks")}
              >
                <div className="admin-sub-card-icon">
                  <FaBook />
                </div>
                <div className="admin-sub-card-text">
                  <h3>Top Downloaded Books</h3>
                  <p>View most downloaded books</p>
                </div>
              </div>
            </div>

            {activeDownloadCard === "history" && (
              <div className="section-card">
                <div className="section-header-row">
                  <h2>Download History</h2>
                  <span className="results-count">
                    {loadingDownloads ? "Loading..." : `${downloadHistory.length} records`}
                  </span>
                </div>

                {loadingDownloads ? (
                  <div className="mini-empty-state">
                    <p>Loading download history...</p>
                  </div>
                ) : downloadHistory.length === 0 ? (
                  <div className="mini-empty-state">
                    <p>No download history found</p>
                    <small>Whenever users download books, records will appear here.</small>
                  </div>
                ) : (
                  <div className="simple-table-wrapper">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Book</th>
                          <th>Category</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {downloadHistory.map((item, index) => (
                          <tr key={item._id || index}>
                            <td>{item.userName || item.user?.name || "-"}</td>
                            <td>{item.userEmail || item.user?.email || "-"}</td>
                            <td>{item.bookTitle || item.book?.title || "-"}</td>
                            <td>{item.category || item.book?.category || "-"}</td>
                            <td>
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleString()
                                : item.downloadedAt
                                ? new Date(item.downloadedAt).toLocaleString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeDownloadCard === "activeUsers" && (
              <div className="section-card">
                <div className="section-header-row">
                  <h2>Most Active Users</h2>
                  <span className="results-count">{analytics.activeUsers.length} users</span>
                </div>

                {analytics.activeUsers.length === 0 ? (
                  <div className="mini-empty-state">
                    <p>No active users found</p>
                    <small>User download activity will appear here.</small>
                  </div>
                ) : (
                  <div className="simple-table-wrapper">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Downloads</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.activeUsers.map((user, index) => (
                          <tr key={user._id || index}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.downloads}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeDownloadCard === "topBooks" && (
              <div className="section-card">
                <div className="section-header-row">
                  <h2>Top Downloaded Books</h2>
                  <span className="results-count">{analytics.topDownloadedBooks.length} books</span>
                </div>

                {analytics.topDownloadedBooks.length === 0 ? (
                  <div className="mini-empty-state">
                    <p>No top downloaded books found</p>
                    <small>Downloaded books ranking will appear here.</small>
                  </div>
                ) : (
                  <div className="simple-table-wrapper">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Book</th>
                          <th>Category</th>
                          <th>Downloads</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topDownloadedBooks.map((book, index) => (
                          <tr key={book._id || index}>
                            <td>{book.title}</td>
                            <td>{book.category}</td>
                            <td>{book.downloads || book.downloadCount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === "reviews" && (
          <div className="dashboard-section">
            <div className="section-topbar">
              <button type="button" className="back-btn" onClick={goBackToOverview}>
                <FaArrowLeft />
                Back
              </button>
            </div>

            <div className="section-title-wrap">
              <h2 className="dashboard-section-title">Reviews Control</h2>
              <p className="dashboard-section-subtitle">
                Click a card below to open ratings and review data
              </p>
            </div>

            <div className="admin-sub-cards-row">
              <div
                className={`admin-sub-card ${activeReviewCard === "allReviews" ? "active-sub-card" : ""}`}
                onClick={() => toggleReviewCard("allReviews")}
              >
                <div className="admin-sub-card-icon">
                  <FaStar />
                </div>
                <div className="admin-sub-card-text">
                  <h3>All Reviews</h3>
                  <p>View all user ratings and comments</p>
                </div>
              </div>

              <div
                className={`admin-sub-card ${activeReviewCard === "topRated" ? "active-sub-card" : ""}`}
                onClick={() => toggleReviewCard("topRated")}
              >
                <div className="admin-sub-card-icon">
                  <FaBook />
                </div>
                <div className="admin-sub-card-text">
                  <h3>Top Rated Books</h3>
                  <p>See highest rated books</p>
                </div>
              </div>

              <div
                className={`admin-sub-card ${activeReviewCard === "recentReviews" ? "active-sub-card" : ""}`}
                onClick={() => toggleReviewCard("recentReviews")}
              >
                <div className="admin-sub-card-icon">
                  <FaDownload />
                </div>
                <div className="admin-sub-card-text">
                  <h3>Recent Reviews</h3>
                  <p>See latest review activity</p>
                </div>
              </div>
            </div>

            {activeReviewCard === "allReviews" && (
              <div className="section-card">
                <div className="section-header-row">
                  <h2>All Reviews</h2>
                  <span className="results-count">
                    {loadingReviews ? "Loading..." : `${reviews.length} reviews`}
                  </span>
                </div>

                {loadingReviews ? (
                  <div className="mini-empty-state">
                    <p>Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="mini-empty-state">
                    <p>No reviews found</p>
                    <small>Once users rate or review books, details will appear here.</small>
                  </div>
                ) : (
                  <div className="simple-table-wrapper">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Book</th>
                          <th>Rating</th>
                          <th>Comment</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.map((review, index) => (
                          <tr key={review.reviewId || review._id || index}>
                            <td>{review.userName || review.user?.name || "-"}</td>
                            <td>{review.bookTitle || review.book?.title || "-"}</td>
                            <td>{review.rating || "-"}</td>
                            <td>{review.comment || "-"}</td>
                            <td>
                              {review.createdAt
                                ? new Date(review.createdAt).toLocaleString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeReviewCard === "topRated" && (
              <div className="section-card">
                <div className="section-header-row">
                  <h2>Top Rated Books</h2>
                  <span className="results-count">{topRatedBooks.length} books</span>
                </div>

                {loadingReviews ? (
                  <div className="mini-empty-state">
                    <p>Loading top rated books...</p>
                  </div>
                ) : topRatedBooks.length === 0 ? (
                  <div className="mini-empty-state">
                    <p>No top rated books data</p>
                    <small>Top rated books will appear after users submit ratings.</small>
                  </div>
                ) : (
                  <div className="simple-table-wrapper">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Book</th>
                          <th>Category</th>
                          <th>Average Rating</th>
                          <th>Total Ratings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topRatedBooks.map((book, index) => (
                          <tr key={book._id || index}>
                            <td>{book.title}</td>
                            <td>{book.category}</td>
                            <td>{book.averageRating || "-"}</td>
                            <td>{book.totalRatings || book.reviewCount || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeReviewCard === "recentReviews" && (
              <div className="section-card">
                <div className="section-header-row">
                  <h2>Recent Reviews</h2>
                  <span className="results-count">{recentReviews.length} latest</span>
                </div>

                {recentReviews.length === 0 ? (
                  <div className="mini-empty-state">
                    <p>No recent reviews</p>
                    <small>Latest review activity will appear here.</small>
                  </div>
                ) : (
                  <div className="simple-table-wrapper">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Book</th>
                          <th>Rating</th>
                          <th>Comment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentReviews.map((review, index) => (
                          <tr key={review.reviewId || review._id || index}>
                            <td>{review.userName || review.user?.name || "-"}</td>
                            <td>{review.bookTitle || review.book?.title || "-"}</td>
                            <td>{review.rating || "-"}</td>
                            <td>{review.comment || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showAddUserForm && (
          <div className="modal-overlay" onClick={() => setShowAddUserForm(false)}>
            <div className="modal admin-clean-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add New User</h2>

              <form onSubmit={handleAddUser} className="admin-modal-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={newUser.name}
                  onChange={handleChangeUser}
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={handleChangeUser}
                  required
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={handleChangeUser}
                  required
                />
                <input
  type="text"
  name="rollNumber"
  placeholder="Roll Number"
  value={newUser.rollNumber || ""}
  onChange={handleChangeUser}
  required   // ✅ add this
/>

                <div className="modal-buttons">
                  <button type="submit" className="submit-btn">
                    Add User
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowAddUserForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddBookForm && (
          <div className="modal-overlay" onClick={() => setShowAddBookForm(false)}>
            <div className="modal admin-clean-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Book</h2>

              <form onSubmit={handleAddBook} className="admin-modal-form">
                <input
                  type="text"
                  name="title"
                  placeholder="Book Title"
                  value={newBook.title}
                  onChange={handleChangeBook}
                  required
                />

                <input
                  type="text"
                  name="author"
                  placeholder="Author"
                  value={newBook.author}
                  onChange={handleChangeBook}
                  required
                />

                <input
                  type="text"
                  name="category"
                  placeholder="Category"
                  value={newBook.category}
                  onChange={handleChangeBook}
                  required
                />

                <input
                  type="text"
                  name="language"
                  placeholder="Language"
                  value={newBook.language}
                  onChange={handleChangeBook}
                  required
                />

                <textarea
                  name="description"
                  placeholder="Enter book description"
                  value={newBook.description}
                  onChange={handleChangeBook}
                  rows="5"
                  required
                />

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  required
                />

                <div className="modal-buttons">
                  <button type="submit" className="submit-btn">
                    Add Book
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowAddBookForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;