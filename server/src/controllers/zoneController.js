import Zone from "../models/Zone.js";

/**
 * GET /api/zones
 * Returns all active zones.
 */
export const getZones = async (req, res, next) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ status: "success", zones });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/zones
 * Admin / Supervisor — create a new zone.
 */
export const createZone = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ status: "error", message: "اسم المنطقة مطلوب" });
    }
    const zone = await Zone.create({ name, description });
    res.status(201).json({ status: "success", zone });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/zones/:id
 * Admin / Supervisor — update a zone.
 */
export const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!zone) {
      return res
        .status(404)
        .json({ status: "error", message: "المنطقة غير موجودة" });
    }
    res.status(200).json({ status: "success", zone });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/zones/:id
 * Admin only — soft-delete by setting isActive = false.
 */
export const deleteZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!zone) {
      return res
        .status(404)
        .json({ status: "error", message: "المنطقة غير موجودة" });
    }
    res.status(200).json({ status: "success", message: "تم حذف المنطقة" });
  } catch (err) {
    next(err);
  }
};
