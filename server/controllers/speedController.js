const axios = require('axios');
const redisClient = require('../config/redis');

// 1. DIRECT FETCH (ARTIFICIALLY SLOW)
exports.fetchDirect = async (req, res) => {
    const start = process.hrtime();
    try {
        const response = await axios.get('https://jsonplaceholder.typicode.com/todos');

        // Simulating a heavy database query (500ms delay)
        await new Promise(resolve => setTimeout(resolve, 500));

        const diff = process.hrtime(start);
        const timeTaken = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);

        res.json({
            source: 'External API (Database)',
            timeTaken: `${timeTaken}ms`,
            data: response.data.slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. REDIS FETCH
exports.fetchRedis = async (req, res) => {
    const start = process.hrtime();
    const CACHE_KEY = 'speed_test_data';

    try {
        const cachedData = await redisClient.get(CACHE_KEY);

        if (cachedData) {
            console.log('Cache Hit. Type:', typeof cachedData);
            const diff = process.hrtime(start);
            const timeTaken = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);

            const data = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;

            return res.json({
                source: 'Redis Cache ⚡',
                timeTaken: `${timeTaken}ms`,
                data: data.slice(0, 5)
            });
        }

        const response = await axios.get('https://jsonplaceholder.typicode.com/todos');

        // Save to Redis (Expire in 60s)
        await redisClient.set(CACHE_KEY, JSON.stringify(response.data), { ex: 60 });

        const diff = process.hrtime(start);
        const timeTaken = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);

        res.json({
            source: 'API (Cache Miss)',
            timeTaken: `${timeTaken}ms`,
            data: response.data.slice(0, 5)
        });

    } catch (error) {
        console.error('Redis Fetch Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// 3. CLEAR CACHE
exports.clearCache = async (req, res) => {
    try {
        await redisClient.del('speed_test_data');
        res.json({ message: 'Cache Cleared' });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};