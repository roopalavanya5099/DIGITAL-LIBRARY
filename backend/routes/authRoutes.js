import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApprovedRollNumber from "../models/ApprovedRollNumber.js";
import { auth, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

/* ==============================
   VERIFY ROLL NUMBER
============================== */
router.post("/verify-roll-number", async (req, res) => {
  const { rollNumber } = req.body;

  if (!rollNumber || !rollNumber.trim()) {
    return res.status(400).json({ message: "Roll number is required" });
  }

  try {
    const normalizedRoll = rollNumber.trim().toUpperCase();

    const validRollNumber = await ApprovedRollNumber.findOne({
      rollNumber: normalizedRoll,
    });

    if (!validRollNumber) {
      return res.status(400).json({
        message: "Invalid roll number. You are not authorized to register",
      });
    }

    const existingUser = await User.findOne({ rollNumber: normalizedRoll });

    if (existingUser) {
      return res.status(400).json({
        message: "This roll number is already registered",
      });
    }

    res.status(200).json({
      message: "Roll number verified successfully",
    });
  } catch (err) {
    console.error("Verify roll number error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==============================
   REGISTER
============================== */
router.post("/register", async (req, res) => {
  const { name, email, password, rollNumber } = req.body;

  if (!rollNumber || !name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Roll number, name, email and password are required" });
  }

  try {
    const normalizedRoll = rollNumber.trim().toUpperCase();
    const normalizedEmail = email.toLowerCase().trim();

    const validRollNumber = await ApprovedRollNumber.findOne({
      rollNumber: normalizedRoll,
    });

    if (!validRollNumber) {
      return res.status(400).json({
        message: "Invalid roll number. You are not authorized to register",
      });
    }

    const existingRollUser = await User.findOne({ rollNumber: normalizedRoll });

    if (existingRollUser) {
      return res.status(400).json({
        message: "This roll number is already registered",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters and include uppercase, lowercase and a number",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      rollNumber: normalizedRoll,
      role: "user",
    });

    await user.save();

    res.status(201).json({
      message: "Registration successful. You can now log in",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==============================
   LOGIN
============================== */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==============================
   GUEST LOGIN
============================== */
router.post("/guest", async (req, res) => {
  try {
    const guestUser = {
      id: `guest_${Date.now()}`,
      name: "Guest User",
      role: "guest",
    };

    const token = jwt.sign(
      {
        id: guestUser.id,
        name: guestUser.name,
        role: guestUser.role,
      },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Guest login successful",
      token,
      role: guestUser.role,
      user: guestUser,
    });
  } catch (err) {
    console.error("Guest login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==============================
   ADMIN ROUTES
============================== */
router.get("/admin/users", auth, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch users error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;