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

const app = express();

const startServer = async () => {
  const dbStatus = await connectDB();

  app.use(cors({
    origin: process.env.CLIENT_URL,
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