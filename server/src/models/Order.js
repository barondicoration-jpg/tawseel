import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    clientPhone: {
      type: String,
      required: [true, "Client phone is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    zone: {
      type: String,
      required: [true, "Zone is required"],
      trim: true,
    },
    locationLink: {
      type: String,
      default: "",
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    collected: {
      type: Number,
      default: 0,
      min: [0, "Collected amount cannot be negative"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in_transit",
        "delivered",
        "returned",
        "partial",
      ],
      default: "pending",
    },
    delegateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    dailySeq: {
      type: Number,
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD — denormalized for fast date queries
      required: true,
    },
  },
  { timestamps: true },
);

// Index for common query patterns
orderSchema.index({ date: 1, status: 1 });
orderSchema.index({ date: 1, zone: 1 });
orderSchema.index({ delegateId: 1, date: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
