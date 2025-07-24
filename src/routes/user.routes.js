// src/routes/user.routes.js
import { Router } from "express";
import { registerUser, loginUser } from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middleware.js';

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

export default router;
