import express from "express";

import {
  deleteItemController,
  getAllPublicItemsController,
  getItemDetailsController,
  getSellerItemsController,
  personalRatingController,
  postingItemController,
  sendAllUserItemsController,
  setRatingController,
  updateItemController,
} from "../controllers/sellerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

/**
 * Seller Routes - Mounted on /api/user/seller
 */

// POST /api/user/seller/postingitem - Create new item with photo upload
router.post(
  "/postingitem",
  authMiddleware,
  upload.single("photo"),
  postingItemController
);

// GET /api/user/seller/getallitems - Get authenticated seller's items (paginated)
router.get("/getallitems", authMiddleware, sendAllUserItemsController);

// GET /api/user/seller/allpublicitems - Get all public marketplace items (paginated)
router.get("/allpublicitems", getAllPublicItemsController);

// GET /api/user/seller/item/:id - Get single item details (public)
router.get("/item/:id", getItemDetailsController);

// GET /api/user/seller/:sellerId/items - Get public items for specific seller (paginated)
router.get("/:sellerId/items", getSellerItemsController);

// DELETE /api/user/seller/:id - Soft delete item
router.delete("/:id", authMiddleware, deleteItemController);

// PUT /api/user/seller/:id - Update item (with optional new photo)
router.put(
  "/:id",
  authMiddleware,
  upload.single("photo"),
  updateItemController
);
router.post("/items/:itemId/rate", authMiddleware, setRatingController);
router.get(
  "/items/:itemId/my-rating",
  authMiddleware,
  personalRatingController
);

export default router;
