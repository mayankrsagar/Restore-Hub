// controllers/orderController.js
import Item from "../schemas/itemModel.js";
import Order from "../schemas/orderModel.js"; // path adjust if needed

export const buyItemController = async (req, res) => {
  try {
    const buyerId = req.user?.id;
    const { itemId } = req.params;

    if (!buyerId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const item = await Item.findById(itemId);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });

    // Prevent buyer buying their own item
    if (item.sellerId?.toString() === buyerId.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot buy your own item" });
    }

    // Create order snapshot
    const order = new Order({
      buyerId,
      sellerId: item.sellerId,
      itemId: item._id,
      itemSnapshot: {
        name: item.name,
        price: item.price,
        type: item.type,
        details: item.details,
        photo: item.photo,
        address: item.address,
        phone: item.phone,
      },
      pricePaid: item.price,
      status: "completed",
    });

    await order.save();

    return res
      .status(201)
      .json({ success: true, message: "Purchase successful", data: order });
  } catch (error) {
    console.error("buyItemController:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getBuyerOrdersController = async (req, res) => {
  try {
    const buyerId = req.user?.id;
    if (!buyerId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // pagination optional: page & limit
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ buyerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("getBuyerOrdersController:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSellerOrdersController = async (req, res) => {
  try {
    const sellerId = req.user?.id;
    if (!sellerId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("getSellerOrdersController:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
