import mongoose from "mongoose";

// Cache connection across warm serverless invocations
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  // Already have a live connection — reuse it
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reset stale promise so we retry on next invocation
  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 30000, // 30s — Vercel functions can be slow to cold-start
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((m) => {
        console.log("✅ MongoDB connected");
        return m;
      })
      .catch((err) => {
        cached.promise = null; // allow retry on next call
        console.error("❌ MongoDB connection error:", err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default connectDB;
