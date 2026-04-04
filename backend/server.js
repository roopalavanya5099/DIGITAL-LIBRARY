import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Routes
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js"; // ✅ PDF download routes
import bookmarkRoutes from "./routes/bookmarkRoutes.js"; // ✅ Bookmark routes

dotenv.config();

/* =========================
   ✅ Initialize Express App
========================= */
const app = express();

/* =========================
   ✅ Fix __dirname for ES Modules
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   ✅ CORS Configuration
========================= */
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* =========================
   ✅ Middleware
========================= */
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   ✅ MongoDB Connection
========================= */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/digital_library";

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();

/* =========================
   ✅ Routes
========================= */
// PDF Routes (downloads)
app.use("/", pdfRoutes); // now /download/:filename works

// Authentication Routes
app.use("/api/users", authRoutes);

// User Routes
app.use("/api/users", userRoutes);

// Book Routes
app.use("/api/books", bookRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

// Bookmark Routes
app.use("/api/bookmarks", bookmarkRoutes);

/* =========================
   ✅ Health Check Route
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    message: "Backend is running",
    status: "ok",
  });
});

/* =========================
   ✅ Global Error Handler
========================= */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    message: "Server error",
    error: err.message,
  });
});

/* =========================
   ✅ Start Server
========================= */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
});