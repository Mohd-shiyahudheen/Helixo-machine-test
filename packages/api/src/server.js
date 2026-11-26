import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { redisClient } from "./config/redis.js";

import shopRoutes from "./routes/shops.js";
import timerRoutes from "./routes/timers.js";
import publicTimerRoutes from "./routes/publicTimers.js";
import analyticsRoutes from "./routes/analytics.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { shopDomainValidator } from "./middleware/shopDomainValidator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// CORS CONFIGURATION
// Must run BEFORE static file serving and API routes.
// --------------------------------------------------

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// --------------------------------------------------
// SECURITY MIDDLEWARE
// Allow cross-origin access to public widget resources.
// --------------------------------------------------

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

// --------------------------------------------------
// BODY PARSING
// --------------------------------------------------

app.use(express.json());

// --------------------------------------------------
// STATIC FILE SERVING
// CORS middleware must execute before these routes.
// --------------------------------------------------

app.use(
  "/widget",
  express.static(path.join(__dirname, "../../widget/dist"))
);

app.use(
  express.static(path.join(__dirname, "../public"))
);

// --------------------------------------------------
// RATE LIMITING
// --------------------------------------------------

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests, please try again later."
  }
});

app.use("/api/", limiter);

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use("/api/shops", shopRoutes);

app.use("/api/timers", timerRoutes);

app.use(
  "/api/public/timers",
  shopDomainValidator,
  publicTimerRoutes
);

app.use("/api/analytics", analyticsRoutes);

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

app.use(errorHandler);

// --------------------------------------------------
// SERVER STARTUP
// --------------------------------------------------

async function start() {
  try {
    await connectDB();
    await redisClient.ping();

    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();

