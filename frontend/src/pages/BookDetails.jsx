import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ReviewForm from "../components/ReviewForm";

function BookDetails() {
  const { id } = useParams(); // book ID from URL
  const [book, setBook] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/books/${id}`);
        setBook(res.data);
      } catch (err) {
        console.error("Fetch book error:", err);
      }
    };
    fetchBook();
  }, [id]);

  if (!book) return <p>Loading book...</p>;

  return (
    <div>
      <h2>{book.title}</h2>
      <p>{book.description}</p>

      <h3>Add a Review</h3>
      <ReviewForm bookId={book._id} onReviewAdded={(review) => {
        // Optional: you can update UI to show new review
        console.log("Review added:", review);
      }} />
    </div>
  );
}

export default BookDetails;