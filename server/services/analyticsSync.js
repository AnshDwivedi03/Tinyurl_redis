const Url = require('../models/Url');
const redisClient = require('../config/redis');

const syncAnalytics = async () => {
    try {
        const clicksData = await redisClient.hgetall('analytics_buffer');
        if (!clicksData) return { synced: 0, message: 'No data to sync' };

        const shortCodes = Object.keys(clicksData);
        if (!shortCodes.length) return { synced: 0, message: 'No data to sync' };

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
            pipeline.hincrby('analytics_buffer', code, -parseInt(clicksData[code]));
        }
        await pipeline.exec();

        console.log(`☁️  Synced ${shortCodes.length} URL stats to Atlas.`);
        return { synced: shortCodes.length, message: 'Sync successful' };
    } catch (err) {
        console.error('Sync failed:', err);
        throw err;
    }
};

module.exports = syncAnalytics;