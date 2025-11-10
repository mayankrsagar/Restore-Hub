import jwt from 'jsonwebtoken';

/**
 * Auth middleware: verifies JWT from cookie only and attaches decoded payload
 * to req.user and req.body.userId (for backward compatibility).
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token missing", success: false });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      // distinct messages help clients handle refresh/reauth flows

      console.log(err);
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token expired", success: false });
      }
      return res.status(401).json({ message: "Invalid token", success: false });
    }

    // Attach useful values for downstream handlers
    // decoded should contain { id, type, email, name } as you included on login
    req.user = decoded;
    // if (decoded.id) req.body.userId = decoded.id;

    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

export default authMiddleware;
