import express from "express";

import {
  deleteItemController,
  getAllPublicItemsController,
  postingItemController,
  sendAllUserItemsController,
  updateItemController,
} from "../controllers/sellerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// POST /api/user/seller/postingitem
router.post(
  "/postingitem",
  authMiddleware,
  upload.single("photo"),
  postingItemController
);

// ✅ FIXED: GET /api/user/seller/getallitems (seller's own items with pagination)
router.get("/getallitems", authMiddleware, sendAllUserItemsController);

// ✅ NEW: GET /api/user/seller/allpublicitems (all items from all sellers with pagination)
router.get("/allpublicitems", getAllPublicItemsController);

// DELETE /api/user/seller/:id
router.delete("/:id", authMiddleware, deleteItemController);

// routes/seller.js
router.put(
  "/:id",
  authMiddleware,
  upload.single("photo"),
  updateItemController
);
export default router;
