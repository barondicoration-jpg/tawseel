import mongoose from "mongoose";

const delegateProgressSchema = new mongoose.Schema(
  {
    delegateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentLocation: {
      type: String,
      default: "",
      trim: true,
    },
    completedOrders: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const DelegateProgress = mongoose.model(
  "DelegateProgress",
  delegateProgressSchema,
);
export default DelegateProgress;
