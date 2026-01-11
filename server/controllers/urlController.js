const Url = require('../models/Url');
const redisClient = require('../config/redis');
const { nanoid } = require('nanoid');

exports.shortenUrl = async (req, res) => {
    const { originalUrl } = req.body;
    if (!originalUrl) return res.status(400).json({ error: 'URL required' });

    try {
        let url = await Url.findOne({ originalUrl, user: req.user.id });

        // Latency Timer
        const measureTime = () => {
            const diff = process.hrtime(req.startTime);
            return (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
        };

        if (url) return res.json({ ...url.toObject(), processTime: measureTime(), cached: true });

        const shortCode = nanoid(8);
        url = new Url({ originalUrl, shortCode, user: req.user.id });
        await url.save();

        // Write-Through to Redis Cloud
        await redisClient.set(`url:${shortCode}`, originalUrl, { ex: 3600 });

        // Add to Trending (Score = 0 initially)
        await redisClient.zadd('trending_urls', { score: 0, member: shortCode });

        res.status(201).json({ ...url.toObject(), processTime: measureTime(), cached: false });
    } catch (err) {
        console.error("Shorten Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const urls = await Url.find({ user: req.user.id }).sort({ createdAt: -1 });

        // Fetch real-time clicks from Redis Buffer
        const buffer = await redisClient.hgetall('analytics_buffer');

        const mergedUrls = urls.map(url => {
            const urlObj = url.toObject();
            const bufferedClicks = buffer && buffer[url.shortCode] ? parseInt(buffer[url.shortCode]) : 0;
            return {
                ...urlObj,
                clicks: urlObj.clicks + bufferedClicks // Current DB + Waiting in Redis
            };
        });

        res.json(mergedUrls);
    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

exports.deleteUrl = async (req, res) => {
    const { id } = req.params;
    const url = await Url.findOneAndDelete({ _id: id, user: req.user.id });
    if (url) {
        await redisClient.del(`url:${url.shortCode}`);
        await redisClient.zrem('trending_urls', url.shortCode);
    }
    res.json({ message: "Deleted" });
};

exports.getTrending = async (req, res) => {
    try {
        // Fetch Top 10 with Scores (Clicks)
        const result = await redisClient.zrange('trending_urls', 0, 9, { rev: true, withScores: true });

        if (!result.length) return res.json([]);

        // Result matches [member, score, member, score] flat array or object based on client version.
        // Upstash/Redis default behavior with withScores: true returns [{ member: 'abc', score: 10 }, ...]
        // Let's handle it safely.

        let trendingMap = {};
        // Check if result is array of objects or flat array (Upstash client depends on version)
        if (typeof result[0] === 'object') {
            // [{ member: 'code', score: 10 }]
            result.forEach(item => trendingMap[item.member] = item.score);
        } else {
            // ['code', 10, 'code2', 5] - Flat array fallback
            for (let i = 0; i < result.length; i += 2) {
                trendingMap[result[i]] = result[i + 1];
            }
        }

        const codes = Object.keys(trendingMap);
        if (!codes.length) return res.json([]);

        const urls = await Url.find({ shortCode: { $in: codes } });

        const sorted = codes.map(c => {
            const u = urls.find(url => url.shortCode === c);
            if (!u) return null;
            return {
                ...u.toObject(),
                clicks: trendingMap[c] // Use REAL-TIME Redis Score
            };
        }).filter(Boolean);

        res.json(sorted);
    } catch (e) {
        console.error("Trending Error:", e);
        res.status(500).json({ error: "Failed to fetch trending" });
    }
};