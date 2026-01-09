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
    await redisClient.set(`url:${shortCode}`, originalUrl, { EX: 3600 });

    res.status(201).json({ ...url.toObject(), processTime: measureTime(), cached: false });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
};

exports.getAnalytics = async (req, res) => {
    const urls = await Url.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(urls);
};

exports.deleteUrl = async (req, res) => {
    const { id } = req.params;
    const url = await Url.findOneAndDelete({ _id: id, user: req.user.id });
    if(url) {
        await redisClient.del(`url:${url.shortCode}`);
        await redisClient.zRem('trending_urls', url.shortCode);
    }
    res.json({ message: "Deleted" });
};

exports.getTrending = async (req, res) => {
    const codes = await redisClient.zRange('trending_urls', 0, 9, { REV: true });
    if (!codes.length) return res.json([]);
    const urls = await Url.find({ shortCode: { $in: codes } });
    const sorted = codes.map(c => urls.find(u => u.shortCode === c)).filter(Boolean);
    res.json(sorted);
};