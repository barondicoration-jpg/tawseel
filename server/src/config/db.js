import mongoose from "mongoose";

// Cache the connection across serverless invocations.
// On Vercel, the module is kept warm between requests in the same
// execution context, so we reuse the existing connection instead of
// opening a new one every time the function is called.
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  // Already connected — reuse
  if (cached.conn) return cached.conn;

  // Connection in progress — wait for it
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so next invocation retries
    cached.promise = null;
    console.error(`❌ MongoDB connection error: ${err.message}`);
    throw err;
  }

  return cached.conn;
};

export default connectDB;
