import mongoose from "mongoose";

/* =========================
   REVIEW SCHEMA
========================= */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/* =========================
   BOOK SCHEMA
========================= */
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  author: {
    type: String,
    required: true,
    trim: true,
  },

  category: {
    type: String,
    required: true,
    trim: true,
  },

  language: {
    type: String,
    default: "English",
    trim: true,
  },

  description: {
    type: String,
    default: "",
    trim: true,
  },

  fileUrl: {
    type: String,
    required: true,
    trim: true,
  },

  downloadCount: {
    type: Number,
    default: 0,
  },

  downloads: {
    type: Number,
    default: 0,
  },

  favorites: {
    type: Number,
    default: 0,
  },

  reviews: {
    type: [reviewSchema],
    default: [],
  },

  averageRating: {
    type: Number,
    default: 0,
  },

  reviewCount: {
    type: Number,
    default: 0,
  },

  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const Book = mongoose.model("Book", bookSchema);

export default Book;