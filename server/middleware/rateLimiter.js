const redisClient = require('../config/redis');

module.exports = async (req, res, next) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const key = `ratelimit:${ip}`;

        const requests = await redisClient.incr(key);

        if (requests === 1) {
            await redisClient.expire(key, 60); // 1 Minute Window
        }

        if (requests > 100) {
            return res.status(429).json({ error: 'Too many requests' });
        }

        next();
    } catch (err) {
        console.error("Rate Limiter Error:", err);
        // If Redis fails, don't crash the app, just let the request through
        next();
    }
};