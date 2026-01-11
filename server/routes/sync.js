const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync');

// Public route - Intended to be called by a Cron job
router.get('/', syncController.triggerSync);

module.exports = router;
