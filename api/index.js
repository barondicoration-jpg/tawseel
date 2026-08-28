/**
 * Vercel Serverless Function entry point.
 *
 * Vercel routes all /api/* requests here (configured in vercel.json).
 * We simply import the Express app and export it — Vercel wraps it
 * in a serverless handler automatically.
 */
import app from "../server/src/app.js";

export default app;
