import cookieParser from "cookie-parser";
import cors from "cors";
// server.js (or index.js)
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import connectToDB from "./config/connect.js";
import commonRoutes from "./routes/commonRoutes.js";
import contactRoutes from "./routes/contact.js";
import orderRoutes from "./routes/orderRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";

dotenv.config(); // make sure env vars are available immediately

// import authRoutes from "./routes/authRoutes.js"; // uncomment if you created authRoutes

const app = express();

// ---------- Basic envs (with sane defaults) ----------
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const NODE_ENV = process.env.NODE_ENV;

// ---------- Connect to DB ----------
try {
  connectToDB();
} catch (err) {
  console.error("Failed to connect to DB on startup:", err);
}

// ---------- Trust proxy (needed when running behind a proxy/load balancer) ----------
if (NODE_ENV === "production") {
  // trust first proxy so secure cookies work when behind reverse proxies
  app.set("trust proxy", 1);
}

// ---------- Middlewares ----------
app.use(helmet());
if (NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------- CORS: allow credentials so cookies can be sent from the browser ----------
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Cookie"],
  })
);

// ---------- Routes ----------
app.use("/api/user", commonRoutes);

app.use("/api/user/seller", sellerRoutes);
app.use("/api/contact", contactRoutes);

// ---------- Health check ----------
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

app.use("/api/user/orders", orderRoutes);

// ---------- Start server ----------
app.listen(PORT, (err) => {
  if (err) {
    console.error("Server failed to start:", err);
    process.exit(1);
  }
  console.log(`✅ Server running in ${NODE_ENV} on port ${PORT}`);
  console.log(`➡️  Frontend allowed origin: ${FRONTEND_URL}`);
});
