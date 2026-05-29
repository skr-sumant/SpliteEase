import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URL = process.env.MONGO_URI;
const DB_NAME = "splitEase_cred";

const connectDB = async()=>{
    try{
        await mongoose.connect(MONGO_URL, {
            dbName: DB_NAME
        });
        console.log("✅ MongoDB Connected");
        return { connected: true };
    }
    catch(error){
        console.log("❌ MongoDB Connection Error:", error.message);
        return { connected: false };
    }
};
export default connectDB;
