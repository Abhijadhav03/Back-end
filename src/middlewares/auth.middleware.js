import asyncHandler from "../utils/asynchandler.js";
import User from "../models/user.modal.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
//   console.log(req.cookies, req.headers.authorization, "Access Token:", token);
  if (!token) {
    return res.status(401).json({ message: "Access token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded JWT:", decoded);
    req.user = decoded;
    await User.findByIdAndUpdate(decoded.id, { lastLogin: new Date() }, { new: true });
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});
