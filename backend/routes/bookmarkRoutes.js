import express from "express";
import mongoose from "mongoose";
import Bookmark from "../models/Bookmark.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .populate("book")
      .sort({ updatedAt: -1 });

    res.status(200).json(bookmarks);
  } catch (error) {
    console.error("Get all bookmarks error:", error);
    res.status(500).json({
      message: "Failed to fetch bookmarks",
      error: error.message,
    });
  }
});

router.get("/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const bookmark = await Bookmark.findOne({
      user: req.user.id,
      book: bookId,
    });

    res.status(200).json(bookmark || null);
  } catch (error) {
    console.error("Get bookmark error:", error);
    res.status(500).json({
      message: "Failed to fetch bookmark",
      error: error.message,
    });
  }
});

router.post("/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { pageNumber } = req.body;

    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    if (!pageNumber || pageNumber < 1) {
      return res.status(400).json({ message: "Valid page number is required" });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { user: req.user.id, book: bookId },
      { pageNumber },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: "Bookmark saved successfully",
      bookmark,
    });
  } catch (error) {
    console.error("Save bookmark error:", error);
    res.status(500).json({
      message: "Failed to save bookmark",
      error: error.message,
    });
  }
});

router.delete("/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    await Bookmark.findOneAndDelete({
      user: req.user.id,
      book: bookId,
    });

    res.status(200).json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.error("Delete bookmark error:", error);
    res.status(500).json({
      message: "Failed to delete bookmark",
      error: error.message,
    });
  }
});

export default router;