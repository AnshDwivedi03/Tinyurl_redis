const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate Token
const genToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// @desc    Register new user
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    console.log("📝 Signup Request Body:", req.body); // Debug Log 1

    const { email, password } = req.body;

    // 1. Validate Input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required' });
    }

    // 2. Explicitly check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 3. Create User
    const user = await User.create({ email, password });

    // 4. Generate Token & Cookie
    const token = genToken(user._id);
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 3600000 
    });

    res.status(201).json({ 
      message: 'User created',
      user: { id: user._id, email: user.email } 
    });

  } catch (error) {
    console.error("❌ Signup Error:", error); // Debug Log 2
    res.status(500).json({ error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/signin
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate Input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const token = genToken(user._id);
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600000 
      });

      res.json({ 
        message: 'Login successful',
        user: { id: user._id, email: user.email } 
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("❌ Signin Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Logout
// @route   POST /api/auth/signout
exports.signout = (req, res) => {
  res.cookie('token', '', { expires: new Date(0), sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' });
  res.status(200).json({ message: 'Signed out successfully' });
};

// @desc    Get Current User
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};