import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true , trim: true},
  username: { type: String, required: true, unique: true, trim: true ,index: true},
  id: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  watchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video', default: [] }],
  likedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video', default: [] }],
  avatar: { type: String, default: 'https://example.com/default-avatar.png' },
  coverImage: { type: String, default: 'https://example.com/default-cover.png' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: [true, 'Password is required'] },
  refreshToken: { type: String, default: null },
},{timestamps: true});
 
const User = mongoose.model("User", userSchema);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.ispasswordMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id, username: this.username, email: this.email, fullname: this.fullname }, 
    process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id
   }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });
};
userSchema.statics.findByUsername = async function (username) {
  return await this.findOne({ username });
};
export default User;