// src/controllers/user.controller.js

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/apierror.js';
import ApiResponse from '../utils/apiresponse.js';
import User from '../models/user.modal.js';
import { uploadImage } from '../utils/cloudinary.js';

// Register user
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, password, email } = req.body;

  if ([fullname, username, password, email].some(field => !field?.trim())) {
    throw new ApiError(400, 'All fields must be filled out.');
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingUser) {
    throw new ApiError(400, 'User with given username or email already exists.');
  }

  const avatarLocalPath = req?.files?.avatar?.[0]?.path;
  const coverLocalPath = req?.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath || !coverLocalPath) {
    throw new ApiError(400, 'Both avatar and cover images are required.');
  }

  const uploadedAvatar = await uploadImage(avatarLocalPath).catch(err => {
    throw new ApiError(500, 'Error uploading avatar image: ' + err.message);
  });

  const uploadedCover = await uploadImage(coverLocalPath).catch(err => {
    throw new ApiError(500, 'Error uploading cover image: ' + err.message);
  });

  const newUser = new User({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: uploadedAvatar.secure_url,
    coverImage: uploadedCover.secure_url
  });

  await newUser.save();
  const userResponse = newUser.toObject();
  delete userResponse.password;

  res.status(201).json(new ApiResponse(201, userResponse, "User registered successfully"));
});

// Login
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required.');
  }

  const user = await User.findOne({ username });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(401, 'Invalid username or password.');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const options = { httpOnly: true, secure: true, sameSite: 'Strict' };
  res.cookie('refreshToken', refreshToken, options);
  res.cookie('accessToken', accessToken, options);

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(200).json(new ApiResponse(200, { user: userResponse, accessToken, refreshToken }, "Login successful"));
});

// Logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: "" },
    $set: { lastLogin: new Date() }
  }, { new: true });

  const options = { httpOnly: true, secure: true, sameSite: 'Strict' };
  return res.clearCookie('refreshToken', options)
            .clearCookie('accessToken', options)
            .status(200)
            .json(new ApiResponse(200, null, 'Logout successful'));
});

// Change Password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!user || !(await user.isPasswordMatch(currentPassword))) {
    throw new ApiError(401, 'Invalid current password');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken || req.headers.authorization?.split(" ")[1];

  if (!incomingRefreshToken) {
    return res.status(401).json(new ApiResponse(401, null, "Refresh token is required"));
  }

  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json(new ApiResponse(403, null, "Invalid or expired refresh token"));
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      return res.status(403).json(new ApiResponse(403, null, "Invalid or expired refresh token"));
    }

    const newAccessToken = user.generateAccessToken();
    const options = { httpOnly: true, secure: true, sameSite: 'Strict' };
    res.cookie('accessToken', newAccessToken, options);
    return res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, "Access token refreshed successfully"));
  });
});

// Middleware
const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new ApiError(401, "Unauthorized - No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    throw new ApiError(401, "Unauthorized - Invalid token");
  }
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

// Update account
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) throw new ApiError(400, "All fields are required");

  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: { fullName, email }
  }, { new: true }).select("-password");

  res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

// Update avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

  const avatar = await uploadImage(avatarLocalPath);
  if (!avatar?.url) throw new ApiError(400, "Error uploading avatar");

  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: { avatar: avatar.url }
  }, { new: true }).select("-password");

  res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});

// Update cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) throw new ApiError(400, "Cover image file is missing");

  const cover = await uploadImage(coverImageLocalPath);
  if (!cover?.url) throw new ApiError(400, "Error uploading cover image");

  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: { coverImage: cover.url }
  }, { new: true }).select("-password");

  res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
});

// Channel Profile
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "Username is required");

  const channel = await User.aggregate([
    { $match: { username: username.toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $in: [req.user?._id, "$subscribers.subscriber"]
        }
      }
    },
    {
      $project: {
        fullName: 1, username: 1, avatar: 1, coverImage: 1, email: 1,
        subscribersCount: 1, channelsSubscribedToCount: 1, isSubscribed: 1
      }
    }
  ]);

  if (!channel.length) throw new ApiError(404, "Channel does not exist");

  res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

// Watch History
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }]
            }
          },
          { $addFields: { owner: { $first: "$owner" } } }
        ]
      }
    }
  ]);

  res.status(200).json(new ApiResponse(200, user[0]?.watchHistory || [], "Watch history fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
  isAuthenticated,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  refreshAccessToken
};




// import asyncHandler from '../utils/asynchandler.js';
// import ApiError from './../utils/apierror.js';
// import User from '../models/user.modal.js'; // Import the User model
// import { cloudinary, uploadImage } from '../utils/cloudinary.js';

// // Register User Controller
// const registerUser = asyncHandler(async (req, res) => {
//   const { fullname, username, password, email } = req.body;

//   // 🔍 1. Basic field validation
//   if ([fullname, username, password, email].some(field => !field || field.trim() === '')) {
//     throw new ApiError(400, 'All fields must be filled out.');
//   }

//   // 🔍 2. Check if user with same username/email exists
//   const existingUser = await User.findOne({
//     $or: [{ username }, { email }]
//   });

//   if (existingUser) {
//     throw new ApiError(400, 'User with given username or email already exists.');
//   }

//   // 🖼️ 3. Fetch avatar and cover image file paths uploaded by multer
//   const avatarlocalpath = req?.files?.avatarImage?.[0]?.path;
//   const coverlocalpath = req?.files?.coverImage?.[0]?.path;

//   if (!avatarlocalpath || !coverlocalpath) {
//     throw new ApiError(400, 'Avatar and cover images are required.');
//   }

//   // ☁️ 4. Upload avatar image to Cloudinary
//   const uploadedAvatar = await uploadImage(avatarlocalpath).catch((err) => {
//     throw new ApiError(500, 'Error uploading avatar image: ' + err.message);
//   });

//   // ☁️ 5. Upload cover image to Cloudinary
//   const uploadedCover = await uploadImage(coverlocalpath).catch((err) => {
//     throw new ApiError(500, 'Error uploading cover image: ' + err.message);
//   });

//   // 📝 6. Create user document (MongoDB object)
//   const newUser = new User({
//     fullname,
//     username: username.toLowerCase(),
//     email,
//     password, // Password will be hashed using mongoose pre-save middleware
//     avatar: uploadedAvatar?.secure_url,
//     coverImage: uploadedCover?.secure_url || ""
//   });

//   // 💾 7. Save user to database
//   await newUser.save();

//   // ✅ 8. Remove sensitive fields before sending to client
//   const userResponse = newUser.toObject();
//   delete userResponse.password;
//   delete userResponse.refreshToken;

//   // 📤 9. Send response to client
//   res.status(201).json({
//     message: 'User registered successfully',
//     user: userResponse
//   });
// });

// // Login User Controller
// const loginUser = asyncHandler(async (req, res) => {
//   const { username, password } = req.body;

//   if (!username || !password) {
//     throw new ApiError(400, 'Username and password are required.');
//   }

//   const user = await User.findOne({ username });
//   if (!user) {
//     throw new ApiError(401, 'Invalid username or password.');
//   }

//   const isMatch = await user.isPasswordMatch(password);
//   if (!isMatch) {
//     throw new ApiError(401, 'Invalid username or password.');
//   }

//   const accessToken = user.generateAccessToken();
//   const refreshToken = user.generateRefreshToken();

//   user.refreshToken = refreshToken;
//   await user.save();

//   const userResponse = user.toObject();
//   delete userResponse.password;

//   res.status(200).json({
//     message: 'Login successful',
//     accessToken,
//     refreshToken,
//     user: userResponse
//   });
// });

// export { registerUser, loginUser };



// import asyncHandler from '../utils/asynchandler.js';
// import ApiError from './../utils/apierror.js';
// import userSchema from '../models/user.model.js';
// import bcrypt from 'bcryptjs';
// import User from '../models/user.modal.js';
// import { jwt } from 'jsonwebtoken';
// const registerUser = asyncHandler(async (req, res) => {
//   const { fullname, username, password, email } = req.body;

//   // Here you would typically add logic to save the user to a database
//   // For demonstration purposes, we'll just return a success message
//     // if (!username || !password) {
//     //   return res.status(400).json({ error: 'Username and password are required.' });
//     // }
// // first we check if the user exists and has filled all required fields username and password(validation)
// //then i will check if user exists in database and if not we wll register yje user
// //create object -- we will save the username and password in the database
// // check for user creation and password hashing
// //return response with user details
// console.log('Registering user:', { fullname, username, email });

// //   res.status(201).json({
// //     message: 'User registered successfully',
// //     user: {
// //       username,
// //       // Password should never be returned in a real application
// //     },
// //   });
// if (!fullname || !username || !password || !email) {
//     return res.status(400).json({ error: 'All fields are required.' });
//   }
//   if (fullname === '' || username === '' || password === '' || email === '') {
//     throw new  ApiError(400, 'All fields must be filled out.');
//   }
// });
// if ([fullname, username, password, email].some(field => field === '')) {
//     throw new ApiError(400, 'All fields must be filled out.');
// }
// const existingUser = await User.findOne({
//   $or: [{ username }, { email }]
// });

// const loginUser = asyncHandler(async (req, res) => {
//   const { username, password } = req.body;

//   // Here you would typically add logic to authenticate the user
//   // For demonstration purposes, we'll just return a success message
// //   if (!username || !password) {
// //     return res.status(400).json({ error: 'Username and password are required.' });
// //   }

//   res.status(200).json({
//     message: 'User logged in successfully',
//     user: {
//       username,
//       // Password should never be returned in a real application
//     },
//   });
// });
// export { registerUser, loginUser };
