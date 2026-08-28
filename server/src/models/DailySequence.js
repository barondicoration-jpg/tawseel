import mongoose from "mongoose";

const dailySequenceSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false },
);

const DailySequence = mongoose.model("DailySequence", dailySequenceSchema);
export default DailySequence;
