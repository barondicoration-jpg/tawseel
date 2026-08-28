import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "يرجى إدخال اسم المستخدم وكلمة السر",
        });
    }

    // Find user and explicitly select password (it's select: false on schema)
    const user = await User.findOne({
      username: username.toLowerCase().trim(),
    }).select("+password");

    if (!user || !(await user.correctPassword(password))) {
      return res
        .status(401)
        .json({
          status: "error",
          message: "اسم المستخدم أو كلمة السر غير صحيحة",
        });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ status: "error", message: "الحساب معطل، تواصل مع المدير" });
    }

    const token = signToken(user._id);

    res.status(200).json({
      status: "success",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      user: req.user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};
