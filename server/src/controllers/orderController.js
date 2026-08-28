import Order from "../models/Order.js";
import DailySequence from "../models/DailySequence.js";

/**
 * Atomically increments and returns the next daily sequence number for a given date.
 */
const getNextSeq = async (date) => {
  const doc = await DailySequence.findOneAndUpdate(
    { date },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return doc.seq;
};

/**
 * GET /api/orders
 * Filters: date, zone, status, search (client name or phone), delegateId
 */
export const getOrders = async (req, res, next) => {
  try {
    const { date, zone, status, search, delegateId } = req.query;

    const filter = {};

    if (date) filter.date = date;
    if (zone) filter.zone = zone;
    if (status) filter.status = status;
    if (delegateId) filter.delegateId = delegateId;

    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { clientPhone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("delegateId", "displayName zone username")
      .sort({ date: -1, dailySeq: 1 });

    res.status(200).json({ status: "success", orders });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/my-orders
 * Returns today's orders assigned to the logged-in delegate.
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const orders = await Order.find({
      delegateId: req.user._id,
    })
      .populate("delegateId", "displayName zone")
      .sort({ date: -1, dailySeq: 1 });

    res.status(200).json({ status: "success", orders });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/:id
 */
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "delegateId",
      "displayName zone",
    );
    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "الأوردر غير موجود" });
    }
    res.status(200).json({ status: "success", order });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/orders
 * Admin / Supervisor only.
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      clientName,
      clientPhone,
      address,
      zone,
      locationLink,
      amount,
      notes,
    } = req.body;

    if (!clientName || !clientPhone || !address || !zone || amount == null) {
      return res
        .status(400)
        .json({ status: "error", message: "يرجى ملء جميع الحقول الإلزامية" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const dailySeq = await getNextSeq(today);

    const order = await Order.create({
      clientName,
      clientPhone,
      address,
      zone,
      locationLink: locationLink || "",
      amount: Number(amount),
      collected: 0,
      status: "pending",
      notes: notes || "",
      dailySeq,
      date: today,
    });

    await order.populate("delegateId", "displayName zone");

    res.status(201).json({ status: "success", order });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/orders/:id
 * Admin / Supervisor can update anything.
 * Delegates can only update status & collected on their own orders.
 */
export const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "الأوردر غير موجود" });
    }

    const isAdminOrSupervisor = ["admin", "supervisor"].includes(req.user.role);
    const isDelegate = req.user.role === "delegate";

    // Delegates can only update their own orders, and only status/collected
    if (isDelegate) {
      if (
        !order.delegateId ||
        order.delegateId.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({
            status: "error",
            message: "ليس لديك صلاحية لتعديل هذا الأوردر",
          });
      }
      const { status, collected } = req.body;
      if (status !== undefined) order.status = status;
      if (collected !== undefined) order.collected = Number(collected);
    } else if (isAdminOrSupervisor) {
      const allowedFields = [
        "clientName",
        "clientPhone",
        "address",
        "zone",
        "locationLink",
        "amount",
        "collected",
        "status",
        "delegateId",
        "notes",
      ];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          order[field] = req.body[field];
        }
      });
      // Auto-set status when assigning a delegate
      if (req.body.delegateId && order.status === "pending") {
        order.status = "assigned";
      }
    } else {
      return res
        .status(403)
        .json({ status: "error", message: "ليس لديك صلاحية" });
    }

    await order.save();
    await order.populate("delegateId", "displayName zone");

    res.status(200).json({ status: "success", order });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/orders/:id
 * Admin / Supervisor only.
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "الأوردر غير موجود" });
    }
    res.status(200).json({ status: "success", message: "تم مسح الأوردر" });
  } catch (err) {
    next(err);
  }
};
