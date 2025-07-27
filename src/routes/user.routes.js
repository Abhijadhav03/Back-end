// src/routes/user.routes.js
import { Router } from "express";
import { registerUser, 
  loginUser,
   logoutUser,
   refreshAccessToken,
   getCurrentUser,
   changePassword,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage
} from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// 👇 Make sure the field names match the ones in frontend/Postman (avatar & coverImage)
router.route("/register").post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh").post(refreshAccessToken);
router.route("/me").post(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changePassword);
router.put("/update-account", verifyJWT, updateAccountDetails);
router.post("/update-avatar", verifyJWT, updateUserAvatar);
router.post("/update-cover-image", verifyJWT, updateUserCoverImage);
export default router;
