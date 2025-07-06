import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DB_NAME } from '../constants.js';

dotenv.config({ path: './.env' });

const connectToDatabase = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`✅ Connected to MongoDB: ${connectionInstance.connection.name} @ ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

export default connectToDatabase;
