// controllers/sellerController.js
import itemSchema from "../schemas/itemModel.js";
import { deleteFromCloudinary, handleUpload } from "../utils/cloudinary.js";

/**
 * POST /postingitem
 */
export const postingItemController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const itemData = { ...req.body, sellerId: userId };

    if (req.file?.buffer) {
      try {
        const uploadResult = await handleUpload(
          {
            buffer: req.file.buffer,
            filename: req.file.originalname || `item-${Date.now()}`,
            folder: "items",
          },
          { resource_type: "auto" }
        );

        itemData.photo = {
          url: uploadResult.secure_url || uploadResult.url,
          public_id: uploadResult.public_id,
          format: uploadResult.format,
          resource_type: uploadResult.resource_type,
        };
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed" });
      }
    }

    const savedItem = new itemSchema(itemData);
    await savedItem.save();

    return res.status(201).json({
      success: true,
      message: "Item posted successfully",
      data: savedItem,
    });
  } catch (error) {
    console.error("Error in posting an Item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to post the item",
    });
  }
};

/**
 * ✅ FIXED: GET /getallitems - Get paginated items for authenticated seller
 */
export const sendAllUserItemsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get paginated items
    const items = await itemSchema
      .find({ sellerId: userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count
    const totalItems = await itemSchema.countDocuments({ sellerId: userId });

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          hasNext: page * limit < totalItems,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getting User Items:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * ✅ NEW: GET /allpublicitems - Get all items from all sellers (public marketplace)
 */
export const getAllPublicItemsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const items = await itemSchema
      .find({})
      .populate("sellerId", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalItems = await itemSchema.countDocuments({});

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          hasNext: page * limit < totalItems,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching all items:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * DELETE /:id
 */
export const deleteItemController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const item = await itemSchema.findById(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });

    if (item.sellerId?.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (item.photo?.public_id) {
      try {
        await deleteFromCloudinary(item.photo.public_id);
      } catch (cloudErr) {
        console.warn("Failed to delete from Cloudinary:", cloudErr);
      }
    }

    await itemSchema.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateItemController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const item = await itemSchema.findById(req.params.id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    if (item.sellerId?.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Update item data
    Object.assign(item, req.body);

    // Handle new image if provided
    if (req.file?.buffer) {
      // Delete old image from cloudinary if exists
      if (item.photo?.public_id) {
        await deleteFromCloudinary(item.photo.public_id);
      }
      // Upload new image
      const uploadResult = await handleUpload({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        folder: "items",
      });
      item.photo = {
        url: uploadResult.secure_url || uploadResult.url,
        public_id: uploadResult.public_id,
        format: uploadResult.format,
        resource_type: uploadResult.resource_type,
      };
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
