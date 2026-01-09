const express = require('express');
const router = express.Router();
const { fetchDirect, fetchRedis, clearCache } = require('../controllers/speedController');

// Public endpoints for speed test (or you can add requireAuth if you want it protected)
router.get('/fetch-direct', fetchDirect);
router.get('/fetch-redis', fetchRedis);
router.post('/clear-cache', clearCache);

module.exports = router;