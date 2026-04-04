import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Book from "../models/Book.js";
import User from "../models/User.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/download/:filename", auth, async (req, res) => {
  try {
    const { filename } = req.params;

    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const book = await Book.findOne({
      fileUrl: { $regex: escapedFilename + "$" },
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyDownloaded = user.downloads.some(
      (bookId) => bookId.toString() === book._id.toString()
    );

    if (!alreadyDownloaded) {
      user.downloads.push(book._id);
      book.downloads = (book.downloads || 0) + 1;

      await user.save();
      await book.save();
    }

    const filePath = path.join(__dirname, "../uploads", filename);

    return res.download(filePath, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          return res.status(404).send("File not found");
        }
      }
    });
  } catch (error) {
    console.error("PDF download route error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;