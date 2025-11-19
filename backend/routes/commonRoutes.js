import express from 'express';

import {
  deleteUserController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  sendAllItemsController,
  sendItemDetailsController,
  updateAvatarController,
  updateProfileController,
} from '../controllers/commonController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import upload from '../middlewares/multer.js';

const router = express.Router();

router.post("/register", registerController);

router.post("/login", loginController);

router.get("/getallitems", sendAllItemsController);

router.get(
  "/fetchitemdetails/:itemId",
  authMiddleware,
  sendItemDetailsController
);

router.put("/profile", authMiddleware, updateProfileController);
router.post(
  "/upload-avatar",
  authMiddleware,
  upload.single("avatar"),
  updateAvatarController
);

router.post("/logout", authMiddleware, logoutController);
router.get("/me", authMiddleware, getMeController);
router.delete("/me", authMiddleware, deleteUserController);
export default router;
