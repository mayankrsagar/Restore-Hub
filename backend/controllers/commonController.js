import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Item from "../schemas/itemModel.js";
import User from "../schemas/userModel.js";
import { deleteFromCloudinary, handleUpload } from "../utils/cloudinary.js";

// Helper to extract user ID consistently
const getUserId = (req) => req.user?.id || req.user?._id;

// Helper to sanitize allowed fields
const sanitizeFields = (body, allowedFields) => {
  const sanitized = {};
  allowedFields.forEach((field) => {
    if (body[field] !== undefined) sanitized[field] = body[field];
  });
  return sanitized;
};

// Allowed fields for registration
const ALLOWED_REGISTER_FIELDS = ["name", "email", "phone", "password", "type"];

/////////// REGISTER
export const registerController = async (req, res) => {
  try {
    // Validate required fields
    const { name, email, phone, password, type } = req.body;
    if (!name || !email || !phone || !password || !type) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, email, phone, password, type",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Hash password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // Sanitize and create user
    const userData = sanitizeFields(req.body, ALLOWED_REGISTER_FIELDS);
    userData.email = userData.email.toLowerCase().trim();
    userData.password = userData.password;

    const user = new User(userData);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Registration successful! You can now log in.",
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
};

/////////// LOGIN
export const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const payload = {
      id: user._id,
      type: user.type,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_KEY, {
      expiresIn: "7d",
    });

    // Prepare safe user data (remove password)
    const { password: _, ...safeUser } = user.toJSON();

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      userData: safeUser,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/////////// LOGOUT
export const logoutController = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/////////// GET ALL ITEMS (PUBLIC)
export const sendAllItemsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const items = await Item.find({ isDeleted: { $ne: true } })
      .populate("sellerId", "name email avatar shopName")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const totalItems = await Item.countDocuments({
      isDeleted: { $ne: true },
    });

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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch items",
    });
  }
};

////////////// FETCH SINGLE ITEM DETAILS
export const sendItemDetailsController = async (req, res) => {
  const { itemId } = req.params;

  try {
    const itemDetails = await Item.findOne({
      _id: itemId,
      isDeleted: { $ne: true },
    })
      .populate("sellerId", "name email avatar shopName")
      .lean();

    if (!itemDetails) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: itemDetails,
    });
  } catch (error) {
    console.error("Error fetching item details:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/////////// GET CURRENT USER
export const getMeController = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const noOfItems = await Item.countDocuments({ sellerId: userId });
    user.totalListings = Number(noOfItems);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in getMeController:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/////////// UPDATE PROFILE
export const updateProfileController = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const allowedFields = [
    "name",
    "phone",
    "address",
    "bio",
    "shopName",
    "whatsapp",
    "email",
    "instagram",
    "facebook",
    "preferredContact",
  ];

  const updateData = sanitizeFields(req.body, allowedFields);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Handle email change with uniqueness check
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
      if (updateData.email !== user.email) {
        const existing = await User.findOne({ email: updateData.email });
        if (existing && existing._id.toString() !== userId.toString()) {
          return res.status(409).json({
            success: false,
            message: "Email is already in use by another account",
          });
        }
      }
    }

    // Update only provided fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && updateData[key] !== "") {
        user[key] = updateData[key];
      }
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error.code === 11000) {
      const key = Object.keys(error.keyValue || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `${key} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

/////////// UPDATE AVATAR
export const updateAvatarController = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Delete old avatar if exists
    if (user.avatar?.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    // Upload new avatar
    const uploadResult = await handleUpload(
      {
        buffer: req.file.buffer,
        filename: req.file.originalname,
        folder: "user_avatars",
      },
      { resource_type: "image" }
    );

    user.avatar = {
      url: uploadResult.secure_url || uploadResult.url,
      public_id: uploadResult.public_id,
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      avatarUrl: user.avatar.url,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update avatar",
    });
  }
};
