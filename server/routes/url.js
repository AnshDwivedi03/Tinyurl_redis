const express = require('express');
const router = express.Router();
const { shortenUrl, getAnalytics, deleteUrl, getTrending } = require('../controllers/urlController');
const { requireAuth } = require('../middleware/auth');

router.post('/shorten', requireAuth, shortenUrl);
router.get('/analytics', requireAuth, getAnalytics);
router.delete('/:id', requireAuth, deleteUrl);
router.get('/trending', getTrending);

module.exports = router;