import express from "express";
import User from "../models/User.js";
import Book from "../models/Book.js";
import bcrypt from "bcryptjs";
import { auth, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   FETCH USERS (only role 'user')
========================= */
router.get("/users", auth, admin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("Fetch Users Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADD NEW USER
========================= */
router.post("/users", auth, admin, async (req, res) => {
  try {
    const { name, email, password, rollNumber } = req.body;

    if (!name || !email || !password || !rollNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanRollNumber = rollNumber.trim().toUpperCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const existingRollNumber = await User.findOne({
      rollNumber: cleanRollNumber,
    });
    if (existingRollNumber) {
      return res.status(400).json({ message: "Roll number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      rollNumber: cleanRollNumber,
      role: "user",
      downloads: [],
      favorites: [],
    });

    await newUser.save();

    res.status(201).json({
      message: "User added successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        rollNumber: newUser.rollNumber,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Add User Error:", err);

    if (err.code === 11000) {
      if (err.keyPattern?.email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (err.keyPattern?.rollNumber) {
        return res.status(400).json({ message: "Roll number already exists" });
      }
      return res.status(400).json({ message: "Duplicate field value" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =========================
   DELETE USER
========================= */
router.delete("/users/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ANALYTICS
========================= */
router.get("/analytics", auth, admin, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });

    const books = await Book.find();
    const users = await User.find({ role: "user" })
      .select("name email rollNumber downloads favorites createdAt")
      .populate("downloads", "title category");

    let totalDownloads = 0;
    let totalFavorites = 0;
    let totalReviews = 0;

    books.forEach((book) => {
      totalDownloads += Number(book.downloadCount || book.downloads || 0);
      totalFavorites += Number(book.favoritesCount || book.favorites || 0);
      totalReviews += Number(book.reviewCount || 0);
    });

    const topDownloadedBooksRaw = await Book.find()
      .sort({ downloadCount: -1, downloads: -1 })
      .limit(5)
      .select("title category downloadCount downloads");

    const topDownloadedBooks = topDownloadedBooksRaw.map((book) => ({
      _id: book._id,
      title: book.title,
      category: book.category,
      downloads: Number(book.downloadCount || book.downloads || 0),
    }));

    const activeUsers = users
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber || "-",
        downloads: Array.isArray(user.downloads) ? user.downloads.length : 0,
      }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 5);

    const categoryMap = {};

    books.forEach((book) => {
      const category = book.category || "Other";
      const count = Number(book.downloadCount || book.downloads || 0);

      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }

      categoryMap[category] += count;
    });

    const downloadsByCategory = Object.keys(categoryMap).map((category) => ({
      category,
      downloads: categoryMap[category],
    }));

    const monthlyDownloads = [
      { month: "Jan", downloads: 12 },
      { month: "Feb", downloads: 20 },
      { month: "Mar", downloads: 28 },
      { month: "Apr", downloads: 18 },
      { month: "May", downloads: 32 },
      { month: "Jun", downloads: 25 },
    ];

    const mostDownloadedBook = await Book.findOne().sort({
      downloadCount: -1,
      downloads: -1,
    });

    const mostFavoritedBook = await Book.findOne().sort({
      favoritesCount: -1,
      favorites: -1,
    });

    const topRatedBooks = books
      .filter((book) => Number(book.reviewCount || 0) > 0)
      .sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0))
      .slice(0, 5)
      .map((book) => ({
        _id: book._id,
        title: book.title,
        author: book.author,
        averageRating: Number(book.averageRating || 0),
        reviewCount: Number(book.reviewCount || 0),
      }));

    const recentReviews = books
      .flatMap((book) =>
        (book.reviews || []).map((review) => ({
          _id: review._id,
          bookId: book._id,
          bookTitle: book.title,
          author: book.author,
          userName: review.userName,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        }))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    const reviewRecords = books.filter(
      (book) => Array.isArray(book.reviews) && book.reviews.length > 0
    ).length;

    const downloadHistory = [];

    users.forEach((user) => {
      if (Array.isArray(user.downloads)) {
        user.downloads.forEach((book) => {
          if (book) {
            downloadHistory.push({
              userName: user.name,
              userEmail: user.email,
              rollNumber: user.rollNumber || "-",
              bookTitle: book.title || "Unknown Book",
              category: book.category || "Unknown",
            });
          }
        });
      }
    });

    res.json({
      totalBooks,
      totalUsers,
      totalDownloads,
      totalFavorites,
      totalReviews,
      reviewRecords,
      mostDownloaded: mostDownloadedBook ? mostDownloadedBook.title : "N/A",
      mostFavorited: mostFavoritedBook ? mostFavoritedBook.title : "N/A",
      monthlyDownloads,
      downloadsByCategory,
      topDownloadedBooks,
      topRatedBooks,
      recentReviews,
      activeUsers,
      downloadHistory,
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;