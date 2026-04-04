import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css";

function AdminBooks() {
  const { token } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    const loadBooks = async () => {
      setLoadingBooks(true);
      try {
        const res = await axios.get("http://localhost:8000/api/books");
        setBooks(res.data);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
      setLoadingBooks(false);
    };
    loadBooks();
  }, []);

  const handleDeleteBook = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(books.filter((book) => book._id !== id));
      alert("Book Deleted Successfully!");
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
      alert("Error deleting book");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Manage Books</h2>
      {loadingBooks ? (
        <p>Loading books...</p>
      ) : (
        <div className="books-list">
          {books.map((book) => (
            <div key={book._id} className="book-card">
              <h3>{book.title}</h3>
              <p><strong>Author:</strong> {book.author}</p>
              <button className="delete-btn" onClick={() => handleDeleteBook(book._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default AdminBooks;
