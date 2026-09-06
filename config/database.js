import mongoose from "mongoose";
import config from "./config.js";
import { ChangeStream } from "mongodb";

async function connectDB() {
    
    await mongoose.connect(config.MONGO_URI)
    console.log("Connected to DB")
}

export default connectDB;