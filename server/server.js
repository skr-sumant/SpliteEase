import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import testRoutes from "./routes/testRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import balanceRoutes from "./routes/balanceRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";


dotenv.config();

if (!process.env.CLIENT_URL) {
  console.warn("⚠️ WARNING: CLIENT_URL environment variable is missing! CORS origin will not be restricted, which can fail or allow unauthorized origins.");
}

const app = express();

const startServer = async () => {
  const dbStatus = await connectDB();

  const clientOrigins = [
    "https://spliteeasee.vercel.app",
    "https://spliteease.vercel.app",
    "http://localhost:5173"
  ];

  if (process.env.CLIENT_URL) {
    const cleanUrl = process.env.CLIENT_URL.replace(/\/$/, "");
    if (!clientOrigins.includes(cleanUrl)) {
      clientOrigins.push(cleanUrl);
    }
  }

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (clientOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("vercel.app")) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true
  }));
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/test", testRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/balances", balanceRoutes);
  app.use("/api/ocr", ocrRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/notifications", notificationRoutes);

  app.get('/', (req, res) => {
    res.json({
      message: "Backend is Running !",
      database: dbStatus.connected ? "Connected" : "Disconnected"
    });
  });

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`\n🚀 Server is Running on port ${PORT}`);
    console.log(`📊 Database Status: ${dbStatus.connected ? "Connected ✅" : "Not Connected ⚠️"}\n`);
  });
};

startServer().catch(err => {
  console.log("🔴 Server startup error:", err);
  process.exit(1);
});