import Item from "../schemas/itemModel.js";
import { deleteFromCloudinary, handleUpload } from "../utils/cloudinary.js";

// Whitelist of allowed fields for items
const ALLOWED_ITEM_FIELDS = [
  "name",
  "address",
  "price",
  "phone",
  "type",
  "details",
  "whatsapp",
  "instagram",
  "facebook",
  "preferredContact",
];

/**
 * POST /postingitem - Create new item with sanitized data
 */
export const postingItemController = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Sanitize body - only allow whitelisted fields
    const sanitizedData = {};
    ALLOWED_ITEM_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        sanitizedData[field] = req.body[field];
      }
    });

    const itemData = {
      ...sanitizedData,
      sellerId: userId,
    };

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

    const savedItem = new Item(itemData);
    await savedItem.save();

    return res.status(201).json({
      success: true,
      message: "Item posted successfully",
      data: savedItem.toJSON(),
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
 * GET /getallitems - Get paginated items for authenticated seller
 */
export const sendAllUserItemsController = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const items = await Item.find({ sellerId: userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const totalItems = await Item.countDocuments({ sellerId: userId });

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
 * GET /allpublicitems - Get all items from all sellers (public marketplace)
 */
export const getAllPublicItemsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const items = await Item.find({})
      .populate("sellerId", "name email avatar shopName")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const totalItems = await Item.countDocuments({});

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
 * DELETE /:id - PERMANENTLY delete item and its Cloudinary image
 */
export const deleteItemController = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    if (item.sellerId?.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Delete image from Cloudinary if exists
    if (item.photo?.public_id) {
      try {
        await deleteFromCloudinary(item.photo.public_id);
      } catch (cloudErr) {
        console.warn("Failed to delete from Cloudinary:", cloudErr);
      }
    }

    // PERMANENT deletion from database
    await Item.findByIdAndDelete(req.params.id);

    return res
      .status(200)
      .json({ success: true, message: "Item deleted permanently" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PUT /:id - Update item with sanitized data
 */
export const updateItemController = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    if (item.sellerId?.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Sanitize body - only allow whitelisted fields
    const sanitizedData = {};
    ALLOWED_ITEM_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        sanitizedData[field] = req.body[field];
      }
    });

    // Update item with sanitized data
    Object.assign(item, sanitizedData);

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
      data: item.toJSON(),
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /item/:id - Get single item details
 */
export const getItemDetailsController = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("sellerId", "name email avatar shopName")
      .lean();

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching item details:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /seller/:sellerId/items - Get public items for a specific seller
 */
export const getSellerItemsController = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const items = await Item.find({ sellerId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const totalItems = await Item.countDocuments({ sellerId });

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
    console.error("Error fetching seller items:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const setRatingController = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { rating } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    // Check if user already rated
    const existingRating = item.ratings.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingRating) {
      existingRating.value = rating; // update existing rating
    } else {
      item.ratings.push({ user: userId, value: rating }); // add new rating
    }

    // Recalculate average and count
    item.ratingCount = item.ratings.length;
    item.ratingAverage =
      item.ratings.reduce((sum, r) => sum + r.value, 0) / item.ratingCount;

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Rating set successfully",
      data: {
        average: item.ratingAverage,
        count: item.ratingCount,
        userRating: rating,
      },
    });
  } catch (error) {
    console.error("Error setting rating:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const personalRatingController = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    const userRating = item.ratings.find(
      (r) => r.user.toString() === userId.toString()
    );

    return res.status(200).json({
      success: true,
      data: {
        average: item.ratingAverage,
        count: item.ratingCount,
        userRating: userRating ? userRating.value : null,
      },
    });
  } catch (error) {
    console.error("Error fetching personal rating:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
