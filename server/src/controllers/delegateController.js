import DelegateProgress from "../models/DelegateProgress.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

/**
 * GET /api/delegates/progress
 * Returns all delegates with their today stats and latest progress.
 */
export const getProgress = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const [delegates, progressDocs, orderAgg] = await Promise.all([
      User.find({ role: "delegate", isActive: true }),
      DelegateProgress.find(),
      Order.aggregate([
        { $match: { date } },
        {
          $group: {
            _id: "$delegateId",
            totalOrders: { $sum: 1 },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            returned: {
              $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] },
            },
            inTransit: {
              $sum: { $cond: [{ $eq: ["$status", "in_transit"] }, 1, 0] },
            },
            pending: {
              $sum: {
                $cond: [{ $in: ["$status", ["pending", "assigned"]] }, 1, 0],
              },
            },
            collected: { $sum: "$collected" },
          },
        },
      ]),
    ]);

    const progressMap = {};
    progressDocs.forEach((p) => {
      progressMap[p.delegateId.toString()] = p;
    });

    const aggMap = {};
    orderAgg.forEach((item) => {
      if (item._id) aggMap[item._id.toString()] = item;
    });

    const result = delegates.map((d) => {
      const prog = progressMap[d._id.toString()];
      const agg = aggMap[d._id.toString()] || {
        totalOrders: 0,
        delivered: 0,
        returned: 0,
        inTransit: 0,
        pending: 0,
        collected: 0,
      };
      return {
        delegate: d.toSafeObject(),
        currentLocation: prog?.currentLocation || "",
        lastUpdate: prog?.lastUpdate || null,
        stats: {
          totalOrders: agg.totalOrders,
          delivered: agg.delivered,
          returned: agg.returned,
          inTransit: agg.inTransit,
          pending: agg.pending,
          collected: agg.collected,
        },
      };
    });

    res.status(200).json({ status: "success", progress: result });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/delegates/progress
 * Update the logged-in delegate's location / progress.
 */
export const updateProgress = async (req, res, next) => {
  try {
    const { currentLocation } = req.body;

    const progress = await DelegateProgress.findOneAndUpdate(
      { delegateId: req.user._id },
      {
        delegateId: req.user._id,
        currentLocation: currentLocation || "",
        lastUpdate: new Date(),
      },
      { upsert: true, new: true },
    );

    res.status(200).json({ status: "success", progress });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/delegates/:id/location
 * Admin / Supervisor can update any delegate's location.
 */
export const updateDelegateLocation = async (req, res, next) => {
  try {
    const { currentLocation } = req.body;
    const { id } = req.params;

    const progress = await DelegateProgress.findOneAndUpdate(
      { delegateId: id },
      {
        delegateId: id,
        currentLocation: currentLocation || "",
        lastUpdate: new Date(),
      },
      { upsert: true, new: true },
    );

    res.status(200).json({ status: "success", progress });
  } catch (err) {
    next(err);
  }
};
