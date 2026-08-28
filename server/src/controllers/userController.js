import User from "../models/User.js";

/**
 * GET /api/users
 * Admin only — returns all users (no passwords).
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });
    res.status(200).json({
      status: "success",
      users: users.map((u) => u.toSafeObject()),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/delegates
 * Returns all active delegate users. Accessible by all authenticated users.
 */
export const getDelegates = async (req, res, next) => {
  try {
    const delegates = await User.find({
      role: "delegate",
      isActive: true,
    }).sort({ displayName: 1 });
    res.status(200).json({
      status: "success",
      delegates: delegates.map((u) => u.toSafeObject()),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * Admin only — create a new user.
 */
export const createUser = async (req, res, next) => {
  try {
    const { username, password, displayName, role, zone } = req.body;

    if (!username || !password || !displayName || !role) {
      return res
        .status(400)
        .json({ status: "error", message: "جميع الحقول مطلوبة" });
    }

    const user = await User.create({
      username,
      password,
      displayName,
      role,
      zone: role === "delegate" ? zone || null : null,
    });

    res.status(201).json({
      status: "success",
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 * Admin only — update a user.
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { displayName, role, zone, password } = req.body;

    const user = await User.findById(id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "المستخدم غير موجود" });
    }

    if (displayName) user.displayName = displayName;
    if (role) user.role = role;
    if (zone !== undefined)
      user.zone = role === "delegate" ? zone || null : null;
    if (password) user.password = password; // pre-save hook will hash it

    await user.save();

    res.status(200).json({
      status: "success",
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Admin only — cannot delete yourself or the last admin.
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res
        .status(400)
        .json({ status: "error", message: "لا يمكنك مسح حسابك الخاص" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "المستخدم غير موجود" });
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ status: "error", message: "لا يمكن مسح المدير الوحيد" });
      }
    }

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ status: "success", message: "تم مسح المستخدم بنجاح" });
  } catch (err) {
    next(err);
  }
};
