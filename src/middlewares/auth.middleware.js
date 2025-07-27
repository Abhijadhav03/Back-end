// src/middlewares/auth.middleware.js

import asyncHandler from "../utils/asynchandler.js";
import User from "../models/user.modal.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found or unauthorized" });
    }

    // Optionally update lastLogin
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});
