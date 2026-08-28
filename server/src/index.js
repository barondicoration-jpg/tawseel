/**
 * index.js — Local development server runner.
 * This file is NOT used by Vercel. Vercel uses api/index.js instead.
 */
import app from "./app.js";

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`,
  );
});
