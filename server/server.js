const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Imports
const connectDB = require("./config/db");
const redisClient = require("./config/redis");
const syncAnalytics = require("./services/analyticsSync");
const distributedRateLimiter = require("./middleware/rateLimiter");

// Routes
const authRoutes = require("./routes/auth");
const urlRoutes = require("./routes/url");
const redirectRoutes = require("./routes/redirect");
const speedRoutes = require("./routes/speed"); // <--- New Import

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Initialization helper (connect DB/Redis). For serverless deployments we call this
// from the wrapper function so we don't start long-running background tasks on import.
const initialize = async () => {
  // Connect to MongoDB if not already connected
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    throw err;
  }

  // Connect to Redis (no-op if already connected)
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log("✅ Redis Connected (Cache Layer)");
  } catch (error) {
    console.error("❌ Redis Connection Error:", error);
  }
};

// --- Middleware ---
app.use(helmet()); // Security Headers
app.use(
  cors({
    // Allow specifying the frontend origin via FRONTEND_URL in env (used in production).
    // Fallback to localhost dev origin for local development.
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // React Frontend URL
    credentials: true, // Allow cookies
  })
);
app.use(express.json({ limit: "10kb" })); // Body parser with size limit
app.use(cookieParser()); // Parse cookies

// --- Observability (Latency Logger) ---
app.use((req, res, next) => {
  req.startTime = process.hrtime();
  res.on("finish", () => {
    const diff = process.hrtime(req.startTime);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
    // Log formatted: Method URL Status Time
    if (req.originalUrl.startsWith("/api")) {
      console.log(
        `⏱️  ${req.method} ${req.originalUrl} [${res.statusCode}] - ${timeInMs}ms`
      );
    }
  });
  next();
});

// --- Apply Rate Limiter ---
// Only apply to API routes, not the redirect route (we want redirects to be fast and frequent)
app.use("/api/", distributedRateLimiter);

// --- Simple health-check (useful for debugging CORS/availability)
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// --- Mount Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);
app.use("/api/speed", speedRoutes); // <--- Mount Speed Routes
app.use("/", redirectRoutes); // Root level for /:code

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// If run directly (not required as a module), initialize and start background worker + server
if (require.main === module) {
  (async () => {
    try {
      await initialize();
      // Start Background Worker for Write-Behind Analytics (only in standalone mode)
      syncAnalytics();

      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error("Failed to start server:", err);
      process.exit(1);
    }
  })();
}

// Export app and initialize for serverless wrappers and tests
module.exports = { app, initialize };
