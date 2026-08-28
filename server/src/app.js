/**
 * app.js — Express application factory.
 *
 * Exported as the default so it can be used:
 *   - As a Vercel serverless function (api/index.js imports this)
 *   - As a regular Node server (src/index.js imports this)
 *
 * NOTE: connectDB() is called here so every serverless cold-start
 * establishes (or reuses) the MongoDB connection before the first request.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import zoneRoutes from "./routes/zoneRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import delegateRoutes from "./routes/delegateRoutes.js";

// Establish (or reuse) the DB connection eagerly
connectDB().catch((err) =>
  console.error("Initial DB connect failed:", err.message),
);

const app = express();

// Middleware to ensure DB is connected before processing any request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res
      .status(503)
      .json({
        status: "error",
        message: "Database unavailable, please try again.",
      });
  }
});

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin SSR)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/delegates", delegateRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res
    .status(404)
    .json({ status: "error", message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
