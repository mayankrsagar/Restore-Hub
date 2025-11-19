/////////// UPDATE PROFILE
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';

import Item from '../schemas/itemModel.js';
import User from '../schemas/userModel.js';
// add at top of the file (adjust relative path if needed)
import {
  deleteFromCloudinary,
  handleUpload,
} from '../utils/cloudinary.js';

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

export const updateProfileController = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Fields allowed for normal profile updates (do NOT include password here)
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

  const updateData = sanitizeFields(req.body || {}, allowedFields);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ---------- Email change (uniqueness) ----------
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

    // ---------- Password change (if requested) ----------
    // Expect the client to send currentPassword, newPassword, confirmPassword to change password
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (
      currentPassword !== undefined ||
      newPassword !== undefined ||
      confirmPassword !== undefined
    ) {
      // If any password field is present, require all three
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message:
            "To change password provide currentPassword, newPassword and confirmPassword.",
        });
      }

      // confirm match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "New password and confirm password do not match.",
        });
      }

      // verify current password using model instance method
      const validCurrent = await user.comparePassword(currentPassword);
      if (!validCurrent) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }

      // optional: enforce password policy here
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long.",
        });
      }

      // assign new password; pre-save hook will hash it
      user.password = newPassword;
    }

    // ---------- Update other profile fields ----------
    Object.keys(updateData).forEach((key) => {
      // assign if provided and not empty string
      if (updateData[key] !== undefined && updateData[key] !== "") {
        user[key] = updateData[key];
      }
    });

    await user.save();

    // user.toJSON() will apply your model transform (removes password, formats avatar/rating)
    const safeUser = typeof user.toJSON === "function" ? user.toJSON() : user;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
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

/**
 * Delete the logged-in user and remove their avatar from Cloudinary (if present).
 */
export const deleteUserController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Helper: extract Cloudinary public_id from different avatar shapes
    const extractPublicIds = (avatar) => {
      if (!avatar) return [];

      // If avatar is an array (multiple images)
      if (Array.isArray(avatar)) {
        return avatar.flatMap((a) => extractPublicIds(a));
      }

      // If avatar is an object with public_id (recommended)
      if (typeof avatar === "object" && avatar.public_id) {
        return [avatar.public_id];
      }

      // If avatar is a string (likely a Cloudinary URL)
      if (typeof avatar === "string") {
        try {
          // Try to parse public_id from a Cloudinary URL:
          // e.g. https://res.cloudinary.com/<cloud>/image/upload/v1234567/folder/subfolder/public_id.jpg
          const afterUpload = avatar.split("/upload/").pop();
          if (!afterUpload) return [];
          // remove version (v12345/) if present
          const withoutVersion = afterUpload.replace(/^v\d+\//, "");
          // remove query string if any
          const noQuery = withoutVersion.split("?")[0];
          // remove file extension
          const publicIdWithPath = noQuery.replace(path.extname(noQuery), "");
          return publicIdWithPath ? [publicIdWithPath] : [];
        } catch (e) {
          return [];
        }
      }

      return [];
    };

    const publicIds = extractPublicIds(user.avatar);

    // Attempt to delete avatars from Cloudinary (if any). Do not fail deletion if Cloudinary call fails.
    if (publicIds.length > 0) {
      for (const pid of publicIds) {
        try {
          await deleteFromCloudinary(pid);
        } catch (err) {
          console.error(`Failed to delete avatar ${pid} from Cloudinary:`, err);
          // continue - we don't abort user deletion just for Cloudinary problems
        }
      }
    }

    // Delete user account (use deleteOne or remove depending on your mongoose version/hooks)
    await User.deleteOne({ _id: userId });

    // Clear login cookie (logout)
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting user",
    });
  }
};
