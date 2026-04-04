// backend/routes/userRoutes.js
import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Book from "../models/Book.js";
import { auth, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   GUEST BLOCK HELPER
========================= */
const blockGuest = (req, res) => {
  if (req.user.role === "guest") {
    res.status(403).json({ message: "Please login to use this feature" });
    return true;
  }
  return false;
};

/* =========================
   ADD TO FAVORITES
========================= */
router.post("/favorite/:bookId", auth, async (req, res) => {
  try {
    if (blockGuest(req, res)) return;

    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid Book ID" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.favorites) {
      user.favorites = [];
    }

    const alreadyFavorite = user.favorites.some(
      (fav) => fav.toString() === bookId
    );

    if (alreadyFavorite) {
      return res.status(400).json({ message: "Book already in favorites" });
    }

    user.favorites.push(bookId);
    await user.save();

    res.status(200).json({
      message: "Book added to favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Favorite error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================
   GET USER FAVORITES
========================= */
router.get("/favorites", auth, async (req, res) => {
  try {
    if (blockGuest(req, res)) return;

    const user = await User.findById(req.user.id).populate("favorites");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.favorites || []);
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================
   REMOVE FROM FAVORITES
========================= */
router.delete("/favorite/:bookId", auth, async (req, res) => {
  try {
    if (blockGuest(req, res)) return;

    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid Book ID" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.favorites) {
      user.favorites = [];
    }

    user.favorites = user.favorites.filter(
      (fav) => fav.toString() !== bookId
    );

    await user.save();

    res.status(200).json({
      message: "Book removed from favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================
   ADD TO DOWNLOADS
========================= */
router.post("/downloads/:bookId", auth, async (req, res) => {
  try {
    if (blockGuest(req, res)) return;

    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid Book ID" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!user.downloads) {
      user.downloads = [];
    }

    const alreadyDownloaded = user.downloads.some(
      (dl) => dl.toString() === bookId
    );

    if (!alreadyDownloaded) {
      user.downloads.push(bookId);
      await user.save();
    }

    if (typeof book.downloadCount !== "number") {
      book.downloadCount = 0;
    }

    book.downloadCount += 1;
    await book.save();

    res.status(200).json({
      message: "Book downloaded successfully",
      downloads: user.downloads,
      downloadCount: book.downloadCount,
    });
  } catch (error) {
    console.error("Add download error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================
   GET USER DOWNLOADS
========================= */
router.get("/downloads", auth, async (req, res) => {
  try {
    if (blockGuest(req, res)) return;

    const user = await User.findById(req.user.id).populate("downloads");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.downloads || []);
  } catch (error) {
    console.error("Get downloads error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================
   REMOVE FROM DOWNLOADS
========================= */
router.delete("/downloads/:bookId", auth, async (req, res) => {
  try {
    if (blockGuest(req, res)) return;

    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid Book ID" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.downloads) {
      user.downloads = [];
    }

    user.downloads = user.downloads.filter(
      (dl) => dl.toString() !== bookId
    );

    await user.save();

    res.status(200).json({
      message: "Book removed from downloads",
      downloads: user.downloads,
    });
  } catch (error) {
    console.error("Remove download error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/* =========================
   ADMIN ROUTES
========================= */
router.get("/admin/users", auth, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.delete("/admin/users/:id", auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;