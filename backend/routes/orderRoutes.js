// routes/orderRoutes.js
import express from "express";

import {
  buyItemController,
  getBuyerOrdersController,
  getSellerOrdersController,
} from "../controllers/orderController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/user/orders/buy/:itemId
router.post("/buy/:itemId", authMiddleware, buyItemController);

// GET /api/user/orders/my  -> buyer's purchases
router.get("/my", authMiddleware, getBuyerOrdersController);

// GET /api/user/orders/seller  -> seller's orders
router.get("/seller", authMiddleware, getSellerOrdersController);
// POST /api/user/buy/:itemId

export default router;
