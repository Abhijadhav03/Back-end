import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, index: true },
  watchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video', default: [] }],
  likedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video', default: [] }],
  avatar: { type: String, default: 'https://example.com/default-avatar.png' },
  coverImage: { type: String, default: 'https://example.com/default-cover.png' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: [true, 'Password is required'] },
  refreshToken: { type: String, default: null },
}, { timestamps: true });

// 🔥 REMOVE THIS LINE: It causes "Cannot overwrite `User` model once compiled" error
// const User = mongoose.model("User", userSchema);

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 🔓 Instance method to check password
userSchema.methods.isPasswordMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// 🔐 Generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, username: this.username, email: this.email, fullname: this.fullname },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
  );
};

// 🔐 Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );
};


// 🔍 Static method to find user by username
userSchema.statics.findByUsername = async function (username) {
  console.log(`Finding user by username: ${username}`);
  const user = await this.findOne({ username });
  console.log(`Found user: ${user}`);
  return user;
  
};


// ✅ Correct placement
const User = mongoose.model("User", userSchema);

export default User;
