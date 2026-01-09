const Url = require('../models/Url');
const redisClient = require('../config/redis');

const syncAnalytics = () => {
    setInterval(async () => {
        try {
            const clicksData = await redisClient.hGetAll('analytics_buffer');
            const shortCodes = Object.keys(clicksData);
            if (!shortCodes.length) return;

            const operations = shortCodes.map(code => ({
                updateOne: {
                    filter: { shortCode: code },
                    update: { 
                        $inc: { clicks: parseInt(clicksData[code]) },
                        $set: { lastVisited: new Date() }
                    }
                }
            }));

            await Url.bulkWrite(operations);
            
            const pipeline = redisClient.multi();
            for (const code of shortCodes) {
                pipeline.hIncrBy('analytics_buffer', code, -parseInt(clicksData[code]));
            }
            await pipeline.exec();
            console.log(`☁️  Synced ${shortCodes.length} URL stats to Atlas.`);
        } catch (err) { console.error('Sync failed:', err); }
    }, 10000);
};

module.exports = syncAnalytics;