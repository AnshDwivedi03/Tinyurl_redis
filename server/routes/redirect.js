const express = require('express');
const router = express.Router();
const { redirectUrl } = require('../controllers/redirectController');

// Middleware validation
const validateCode = (req, res, next) => {
    const { code } = req.params;
    // Allow alphanumeric, underscores, and dashes
    if (/^[a-zA-Z0-9_-]{8}$/.test(code)) {
        next();
    } else {
        res.status(404).json({ error: 'Invalid short code format' });
    }
};

router.get('/:code', validateCode, redirectUrl);

module.exports = router;