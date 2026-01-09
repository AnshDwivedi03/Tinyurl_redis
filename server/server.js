const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('redis');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = 5001;

app.use(cors());

// --- REDIS SETUP ---
// Connect to Redis using the REDIS_URL from your .env file
// If not found in .env, fallback to localhost for safety
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Redis Cloud Connected (Demo App)');
    } catch (err) {
        console.error('❌ Redis Connection Error:', err);
    }
})();

// --- ENDPOINT 1: SLOW (Simulate Database/External API) ---
app.get('/api/fetch-direct', async (req, res) => {
    const start = process.hrtime();
    
    try {
        // Fetch from external API (simulating DB latency)
        const response = await axios.get('https://jsonplaceholder.typicode.com/todos');
        
        // Add fake delay (500ms) to simulate a real-world slow database query
        await new Promise(resolve => setTimeout(resolve, 500));

        const diff = process.hrtime(start);
        const timeTaken = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);

        res.json({
            source: 'External API (Database)',
            timeTaken: `${timeTaken}ms`,
            data: response.data.slice(0, 5) // Send top 5 items
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ENDPOINT 2: FAST (Redis Cache) ---
app.get('/api/fetch-redis', async (req, res) => {
    const start = process.hrtime();
    const CACHE_KEY = 'todos_data_demo';

    try {
        // 1. Check Redis Cache
        const cachedData = await redisClient.get(CACHE_KEY);

        if (cachedData) {
            const diff = process.hrtime(start);
            const timeTaken = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);

            return res.json({
                source: 'Redis Cache ⚡',
                timeTaken: `${timeTaken}ms`,
                data: JSON.parse(cachedData).slice(0, 5)
            });
        }

        // 2. Cache Miss: Fetch from External API
        const response = await axios.get('https://jsonplaceholder.typicode.com/todos');
        
        // 3. Save to Redis (Expire in 60s)
        await redisClient.set(CACHE_KEY, JSON.stringify(response.data), { EX: 60 });

        const diff = process.hrtime(start);
        const timeTaken = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);

        res.json({
            source: 'API (Cache Miss)',
            timeTaken: `${timeTaken}ms`,
            data: response.data.slice(0, 5)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper: Clear Cache
app.post('/api/clear-cache', async (req, res) => {
    await redisClient.del('todos_data_demo');
    res.json({ message: 'Cache Cleared' });
});

app.listen(PORT, () => {
    console.log(`🚀 Demo Server running on port ${PORT}`);
});