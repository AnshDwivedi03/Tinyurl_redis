const jwt = require('jsonwebtoken');

const JWT_SECRET = 'my_Secret_key'; 

function validateToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function requireAuth(req, res, next) {
  const token = req.cookies['token'];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Please sign in" });
  }

  try {
    const payload = validateToken(token);
    req.user = payload;
    next();
  } catch (error) {
    console.error('Invalid token:', error.message);
    return res.status(403).json({ error: "Session expired or invalid. Please sign in again." });
  }
}


module.exports = { requireAuth };
