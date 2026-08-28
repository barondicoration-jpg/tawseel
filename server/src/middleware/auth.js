import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Sign a JWT token for the given user id.
 */
export const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Middleware: verifies Bearer JWT and attaches req.user.
 */
export const protect = async (req, res, next) => {
  try {
    // 1) Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "error", message: "غير مصرح. يرجى تسجيل الدخول." });
    }

    const token = authHeader.split(" ")[1];

    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({
          status: "error",
          message: "رمز غير صالح أو منتهي الصلاحية. يرجى تسجيل الدخول مجدداً.",
        });
    }

    // 3) Check the user still exists
    const user = await User.findById(decoded.id).select(
      "+role +zone +displayName +username +isActive",
    );
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "المستخدم غير موجود." });
    }

    if (!user.isActive) {
      return res.status(403).json({ status: "error", message: "الحساب معطل." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware factory: restricts access to users with specified roles.
 * Usage: restrictTo('admin', 'supervisor')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
      });
    }
    next();
  };
};
