const jwt = require('jsonwebtoken');

exports.requireAuth = (req, res, next) => {
  // 1. Get token
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    
    // 3. Call next() to proceed
    next(); 
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};