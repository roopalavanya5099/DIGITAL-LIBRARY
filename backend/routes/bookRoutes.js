import express from "express";
import multer from "multer";
import path from "path";
import Book from "../models/Book.js";
import { auth, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   Multer Configuration
========================= */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

/* =========================
   Helpers
========================= */
const calculateAverageRating = (reviews = []) => {
  const validRatings = reviews.filter(
    (item) => Number(item?.rating) > 0 && Number(item?.rating) <= 5
  );

  if (!validRatings.length) return 0;

  const total = validRatings.reduce(
    (sum, item) => sum + Number(item?.rating || 0),
    0
  );

  return Number((total / validRatings.length).toFixed(1));
};

const calculateReviewCount = (reviews = []) => {
  return reviews.filter(
    (item) => item?.comment && item.comment.trim() !== ""
  ).length;
};

/* =========================
   ADMIN - GET ALL REVIEWS
   IMPORTANT: keep this ABOVE "/:id"
========================= */
router.get("/admin/all-reviews", auth, admin, async (req, res) => {
  try {
    const books = await Book.find()
      .populate("reviews.user", "name email")
      .sort({ uploadDate: -1 });

    const allReviews = [];

    books.forEach((book) => {
      if (book?.reviews && Array.isArray(book.reviews)) {
        book.reviews.forEach((review) => {
          if (review?.comment && review.comment.trim() !== "") {
            allReviews.push({
              reviewId: review._id,
              bookId: book._id,
              bookTitle: book.title,
              author: book.author,
              userName: review.userName || review.user?.name || "User",
              userEmail: review.user?.email || "",
              rating: review.rating || 0,
              comment: review.comment || "",
              createdAt: review.createdAt || new Date(),
            });
          }
        });
      }
    });

    allReviews.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    res.status(200).json(allReviews);
  } catch (error) {
    console.error("Admin Reviews Error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

/* =========================
   Get All Books
========================= */
router.get("/", async (req, res) => {
  try {
    const books = await Book.find().sort({ uploadDate: -1 });
    res.json(books);
  } catch (err) {
    console.error("Get Books Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   Get Single Book
========================= */
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      "reviews.user",
      "name email"
    );

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(book);
  } catch (err) {
    console.error("Get Single Book Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   Create Book (Admin Only)
========================= */
router.post("/", auth, admin, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }

    const { title, author, category, language, description } = req.body;

    const newBook = new Book({
      title,
      author,
      category,
      language,
      description,
      fileUrl: `/uploads/${req.file.filename}`,
      downloadCount: 0,
      downloads: 0,
      favorites: 0,
      reviews: [],
      averageRating: 0,
      reviewCount: 0,
    });

    await newBook.save();

    res.status(201).json(newBook);
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   Delete Book (Admin Only)
========================= */
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   Increment Download Count
========================= */
router.post("/:id/download", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    book.downloadCount = (book.downloadCount || 0) + 1;
    book.downloads = (book.downloads || 0) + 1;

    await book.save();

    res.json(book);
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   Add / Update Review
   Body: { comment, rating }
========================= */
router.post("/:id/review", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const trimmedComment = comment?.trim() || "";
    const numericRating = Number(rating);

    if (!trimmedComment) {
      return res.status(400).json({
        message: "Review comment is required",
      });
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!book.reviews) {
      book.reviews = [];
    }

    const userId = req.user.id;

    const existingReviewIndex = book.reviews.findIndex(
      (item) => item.user.toString() === userId.toString()
    );

    if (existingReviewIndex !== -1) {
      book.reviews[existingReviewIndex].comment = trimmedComment;
      book.reviews[existingReviewIndex].rating = numericRating;
      book.reviews[existingReviewIndex].userName = req.user.name || "User";
      book.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      book.reviews.push({
        user: userId,
        userName: req.user.name || "User",
        rating: numericRating,
        comment: trimmedComment,
        createdAt: new Date(),
      });
    }

    book.reviewCount = calculateReviewCount(book.reviews);
    book.averageRating = calculateAverageRating(book.reviews);

    await book.save();

    const updatedBook = await Book.findById(req.params.id).populate(
      "reviews.user",
      "name email"
    );

    res.status(200).json({
      message:
        existingReviewIndex !== -1
          ? "Review updated successfully"
          : "Review added successfully",
      book: updatedBook,
      averageRating: updatedBook.averageRating,
      reviewCount: updatedBook.reviewCount,
      reviews: updatedBook.reviews,
    });
  } catch (error) {
    console.error("Review Error:", error);
    res.status(500).json({
      message: "Server error while adding review",
    });
  }
});

/* =========================
   Delete Review
========================= */
router.delete("/:id/review", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!book.reviews) {
      book.reviews = [];
    }

    const oldLength = book.reviews.length;

    book.reviews = book.reviews.filter(
      (item) => item.user.toString() !== req.user.id.toString()
    );

    if (book.reviews.length === oldLength) {
      return res.status(404).json({ message: "Review not found" });
    }

    book.reviewCount = calculateReviewCount(book.reviews);
    book.averageRating = calculateAverageRating(book.reviews);

    await book.save();

    const updatedBook = await Book.findById(req.params.id).populate(
      "reviews.user",
      "name email"
    );

    res.status(200).json({
      message: "Review deleted successfully",
      book: updatedBook,
      averageRating: updatedBook.averageRating,
      reviewCount: updatedBook.reviewCount,
      reviews: updatedBook.reviews,
    });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({
      message: "Server error while deleting review",
    });
  }
});

/* =========================
   Get Book Reviews
========================= */
router.get("/:id/reviews", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .select("reviews averageRating reviewCount")
      .populate("reviews.user", "name email");

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({
      reviews: book.reviews || [],
      averageRating: book.averageRating || 0,
      reviewCount: book.reviewCount || 0,
    });
  } catch (err) {
    console.error("Get Reviews Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   Rate Route
   Body: { rating }
========================= */
router.post("/:id/rate", auth, async (req, res) => {
  try {
    const { rating } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!book.reviews) {
      book.reviews = [];
    }

    const userId = req.user.id;

    const existingReviewIndex = book.reviews.findIndex(
      (item) => item.user.toString() === userId.toString()
    );

    if (existingReviewIndex !== -1) {
      book.reviews[existingReviewIndex].rating = numericRating;
      book.reviews[existingReviewIndex].userName = req.user.name || "User";
      book.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      book.reviews.push({
        user: userId,
        userName: req.user.name || "User",
        rating: numericRating,
        comment: "",
        createdAt: new Date(),
      });
    }

    book.reviewCount = calculateReviewCount(book.reviews);
    book.averageRating = calculateAverageRating(book.reviews);

    await book.save();

    const updatedBook = await Book.findById(req.params.id).populate(
      "reviews.user",
      "name email"
    );

    res.status(200).json({
      message:
        existingReviewIndex !== -1
          ? "Rating updated successfully"
          : "Rating added successfully",
      book: updatedBook,
      averageRating: updatedBook.averageRating,
      reviewCount: updatedBook.reviewCount,
      reviews: updatedBook.reviews,
    });
  } catch (error) {
    console.error("Rating Error:", error);
    res.status(500).json({
      message: "Server error while adding rating",
    });
  }
});

export default router;