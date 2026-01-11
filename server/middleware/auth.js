const jwt = require('jsonwebtoken');

exports.requireAuth = (req, res, next) => {
  // Debug Log: Incoming Headers
  // console.log('Auth Middleware Headers:', req.headers); 

  let token = req.cookies.token;
  let headerToken = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    headerToken = req.headers.authorization.split(' ')[1];
  }

  // Helper to verify a single token
  const verifyToken = (t) => {
    try {
      return jwt.verify(t, process.env.JWT_SECRET);
    } catch (e) { return null; }
  };

  // 1. Try Cookie
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      console.log(`✅ Auth Success [Cookie]: User ${decoded.id}`);
      return next();
    }
    console.log('⚠️ Cookie Token Invalid. Trying Header...');
  }

  // 2. Try Header (if Cookie missing or invalid)
  if (headerToken) {
    const decoded = verifyToken(headerToken);
    if (decoded) {
      req.user = decoded;
      console.log(`✅ Auth Success [Bearer Header]: User ${decoded.id}`);
      return next();
    }
    console.log('❌ Auth Failed [Bearer Header]: Invalid Token');
  }

  // 3. Fallback: Fail
  console.log('❌ Auth Failed: No valid credentials');
  return res.status(401).json({ error: 'Authentication required' });
};