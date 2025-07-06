import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectToDatabase from './db/index.js';
import { DB_NAME } from './constants.js';
dotenv.config({ path: './.env' });
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Middleware setup

const app = express();
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

app.use(express.json({limit: '50mb'}));// Increased limit for large JSON payloads
app.use(express.urlencoded({ extended: true }));
// Connect to the database
app.use(express.static('public')); // Serve static files from the 'public' directory
app.get('/', (req, res) => {
    res.send('Welcome to the API');
});
app.get('/user', (req, res) => {
    res.json({ message: 'User endpoint' });
});

connectToDatabase().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`);
    });
}).catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1); // Exit the process if the database connection fails
}); 
export { app }