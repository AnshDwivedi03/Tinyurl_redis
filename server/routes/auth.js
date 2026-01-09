const express = require('express');
const router = express.Router();
const { signup, signin, signout, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', signout);
router.get('/me', requireAuth, getMe);

module.exports = router;