import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectToDatabase from './db/index.js';
import { DB_NAME } from './constants.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fetch from 'node-fetch'; // if you're using Node.js <18, install via: npm i node-fetch

dotenv.config({ path: './.env' });

const app = express();

// Middleware
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the API');
});

app.get('/user', (req, res) => {
    res.json({ message: 'User endpoint' });
});

import userRoutes from './routes/user.routes.js';
app.use('/api/v1/users', userRoutes);

app.get('/restaurants', async (req, res) => {
    const { lat, lng } = req.query;
   

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const url = `https://www.swiggy.com/dapi/restaurants/list/v5?lat=${lat}&lng=${lng}&page_type=DESKTOP_WEB_LISTING`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://www.swiggy.com/',
            }
        });

        const data = await response.json();

        if (data.statusCode && data.statusCode !== 0) {
            return res.status(500).json({ error: 'Swiggy API error', details: data });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching Swiggy data:', error);
        res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
});

// Start server after DB connection
const PORT = process.env.PORT || 8000;
connectToDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Connected to MongoDB: ${DB_NAME}`);
            console.log(`🚀 App is listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    });

export { app };
