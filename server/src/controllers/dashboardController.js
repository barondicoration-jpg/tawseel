import Order from "../models/Order.js";
import User from "../models/User.js";

/**
 * GET /api/dashboard/stats
 * Returns aggregated stats for today (or specified date).
 */
export const getStats = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const [
      totalToday,
      delivered,
      returned,
      pending,
      inTransit,
      assigned,
      partial,
      collectionAgg,
    ] = await Promise.all([
      Order.countDocuments({ date }),
      Order.countDocuments({ date, status: "delivered" }),
      Order.countDocuments({ date, status: "returned" }),
      Order.countDocuments({ date, status: "pending" }),
      Order.countDocuments({ date, status: "in_transit" }),
      Order.countDocuments({ date, status: "assigned" }),
      Order.countDocuments({ date, status: "partial" }),
      Order.aggregate([
        { $match: { date, status: { $in: ["delivered", "partial"] } } },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: "$collected" },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const totalCollected = collectionAgg[0]?.totalCollected || 0;
    const totalAmount = collectionAgg[0]?.totalAmount || 0;

    res.status(200).json({
      status: "success",
      stats: {
        date,
        totalToday,
        delivered,
        returned,
        pending,
        inTransit,
        assigned,
        partial,
        totalCollected,
        totalAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/collections
 * Returns per-delegate collection summary for a given date.
 */
export const getCollections = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    // Get all delegates
    const delegates = await User.find({ role: "delegate", isActive: true });

    // Aggregate orders per delegate for the date
    const orderAgg = await Order.aggregate([
      { $match: { date } },
      {
        $group: {
          _id: "$delegateId",
          totalOrders: { $sum: 1 },
          delivered: {
            $sum: {
              $cond: [{ $in: ["$status", ["delivered", "partial"]] }, 1, 0],
            },
          },
          returned: {
            $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] },
          },
          totalAmount: { $sum: "$amount" },
          totalCollected: { $sum: "$collected" },
        },
      },
    ]);

    const aggMap = {};
    orderAgg.forEach((item) => {
      if (item._id) aggMap[item._id.toString()] = item;
    });

    const collections = delegates.map((d) => {
      const agg = aggMap[d._id.toString()] || {
        totalOrders: 0,
        delivered: 0,
        returned: 0,
        totalAmount: 0,
        totalCollected: 0,
      };
      return {
        delegate: d.toSafeObject(),
        ...agg,
        _id: undefined,
      };
    });

    res.status(200).json({ status: "success", date, collections });
  } catch (err) {
    next(err);
  }
};
