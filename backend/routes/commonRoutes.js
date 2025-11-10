import express from 'express';

import {
  getMeController,
  loginController,
  logoutController,
  registerController,
  sendAllItemsController,
  sendItemDetailsController,
} from '../controllers/commonController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/register", registerController);

router.post("/login", loginController);

router.get("/getallitems", authMiddleware, sendAllItemsController);

router.get(
  "/fetchitemdetails/:itemId",
  authMiddleware,
  sendItemDetailsController
);

router.post("/logout", authMiddleware, logoutController);
router.get("/me", authMiddleware, getMeController);
export default router;
