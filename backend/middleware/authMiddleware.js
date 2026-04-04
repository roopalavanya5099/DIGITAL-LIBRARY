import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =========================
   AUTH MIDDLEWARE
========================= */
export const auth = async (req, res, next) => {
  const token =
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_key_change_in_production"
    );

    // Guest user ki DB check avasaram ledu
    if (decoded.role === "guest") {
      req.user = {
        id: decoded.id,
        name: decoded.name || "Guest User",
        role: "guest",
      };
      return next();
    }

    // Normal user/admin ni DB nunchi fetch cheyyali
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

/* =========================
   ADMIN MIDDLEWARE
========================= */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access denied" });
  }
};