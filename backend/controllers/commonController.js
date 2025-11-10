import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import itemSchema from '../schemas/itemModel.js';
import userSchema from '../schemas/userModel.js';

/////////// for register
export const registerController = async (req, res) => {
  try {
    const existingUser = await userSchema.findOne({ email: req.body.email });
    if (existingUser)
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });

    // Hash password with salt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new userSchema({
      ...req.body,
      password: hashedPassword,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "User has been created! Now you should be able to log in.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/////////// for login
// loginController (stores token in cookie only)
export const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userSchema.findOne({ email });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });

    const isValidPass = await bcrypt.compare(password, user.password);
    if (!isValidPass) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    // create token (1 hour)
    const token = jwt.sign(
      { id: user._id, type: user.type, email: user.email, name: user.name },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );

    // remove password before sending user object
    user.password = undefined;

    // cookie options
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in prod
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // e.g., 1 hour for access token
    });

    // set cookie named 'token'
    // res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      message: "Login successful",
      success: true,
      userData: user,
    });
  } catch (error) {
    console.log("Error : ", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

// Optional logout controller (clears cookie)
export const logoutController = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    console.log("Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//////// send all items to frontend
export const sendAllItemsController = async (req, res) => {
  try {
    const allItems = await itemSchema.find();

    if (!allItems)
      return res.status(404).json({
        success: false,
        message: "No items found!!",
      });

    return res.status(200).json({
      success: true,
      data: allItems,
    });
  } catch (error) {
    console.log("Error in sending all Items : ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

////////////// fetch item details
export const sendItemDetailsController = async (req, res) => {
  const { itemId } = req.params;
  try {
    const itemDetails = await itemSchema.findById(itemId);

    if (!itemDetails) {
      return res.status(404).json({
        success: false,
        error: "No item found",
      });
    }

    return res.status(200).json({
      success: true,
      data: itemDetails,
    });
  } catch (error) {
    console.log("Error in fetching the item Details : ", error);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

export const getMeController = async (req, res) => {
  try {
    const user = req.user || null; // set by authMiddleware
    console.log("inside the me");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Only return safe user info
    const { id, email, name, type } = user;

    return res.status(200).json({
      success: true,
      user: { id, email, name, type },
    });
  } catch (error) {
    console.error("Error in getMeController:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
