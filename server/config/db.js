import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URL = process.env.MONGO_URI;
const DB_NAME = "splitEase_cred";

const connectDB = async () => {
  try {
    if (MONGO_URL) {
      await mongoose.connect(MONGO_URL, {
        dbName: DB_NAME,
        serverSelectionTimeoutMS: 5000
      });
      console.log("✅ MongoDB Atlas Connected Successfully!");
      return { connected: true, mode: "atlas" };
    }
    throw new Error("No MONGO_URI specified in env");
  } catch (error) {
    console.log("⚠️ MongoDB Atlas Connection Failed:", error.message);
    console.log("🔄 Initializing automatic in-memory Mongo database fallback...");

    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log("✅ In-Memory MongoDB Fallback Connected Successfully!");
      return { connected: true, mode: "memory" };
    } catch (memError) {
      console.log("❌ In-Memory MongoDB Fallback Error:", memError.message);
      return { connected: false, error: memError.message };
    }
  }
};

export default connectDB;
