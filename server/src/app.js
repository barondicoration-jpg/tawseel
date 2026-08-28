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

const app = express();

// ── CORS — allow all origins (frontend & backend are on same vercel domain) ──
app.use(
  cors({
    origin: true, // reflect the request origin — allows any origin
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));

// ── DB connection middleware — only for /api routes that need DB ──────────────
app.use("/api", async (req, res, next) => {
  // Health check doesn't need DB
  if (req.path === "/health") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(503).json({
      status: "error",
      message: `DB connection failed: ${err.message}`,
    });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/delegates", delegateRoutes);

// Health check — no DB needed
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongo_uri_set: !!process.env.MONGO_URI,
    node_env: process.env.NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  res
    .status(404)
    .json({ status: "error", message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

export default app;
