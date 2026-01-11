const syncAnalytics = require('../services/analyticsSync');

exports.triggerSync = async (req, res) => {
    try {
        const result = await syncAnalytics();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Sync failed' });
    }
};
