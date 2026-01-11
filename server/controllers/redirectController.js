const Url = require('../models/Url');
const redisClient = require('../config/redis');

exports.redirectUrl = async (req, res) => {
    const { code } = req.params;
    try {
        let originalUrl = await redisClient.get(`url:${code}`);

        if (!originalUrl) {
            const url = await Url.findOne({ shortCode: code });
            if (!url) return res.status(404).json({ error: 'Not Found' });
            originalUrl = url.originalUrl;
            await redisClient.set(`url:${code}`, originalUrl, { EX: 3600 });
        }

        const pipeline = redisClient.pipeline();
        pipeline.zincrby('trending_urls', 1, code);
        pipeline.hincrby('analytics_buffer', code, 1);
        await pipeline.exec();

        const diff = process.hrtime(req.startTime);
        const timeTaken = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
        res.setHeader('X-Response-Time', `${timeTaken}ms`);

        return res.redirect(originalUrl);
    } catch (err) { res.status(500).json({ error: 'Error' }); }
};