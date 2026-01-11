const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Imports
const connectDB = require('./config/db');
// const redisClient = require('./config/redis'); // Initialized in config
// const syncAnalytics = require('./services/analyticsSync'); // Now an API endpoint
const distributedRateLimiter = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const redirectRoutes = require('./routes/redirect');
const speedRoutes = require('./routes/speed');
const syncRoutes = require('./routes/sync'); // <--- New Import

// Initialize App
const app = express();
app.set('trust proxy', 1); // Trust first proxy (Vercel)
const PORT = process.env.PORT || 5000;

// Validate Env Vars
const requiredEnv = ['MONGO_URI', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'CLIENT_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error(`❌ CRITICAL: Missing Environment Variables: ${missingEnv.join(', ')}`);
}

// Connect to Databases
connectDB().catch(err => console.error("Init Connection Failed:", err)); // MongoDB
// Redis connection is stateless/HTTP with Upstash, no explicit connect() needed.

// --- Middleware ---
app.use(helmet()); // Security Headers
// Sanitize CLIENT_URL (Remove trailing slash)
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:5173';

app.use(cors({
    origin: clientUrl,
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Debug Middleware: Log Origin and Cookies
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`🔍 [${req.method}] ${req.path}`);
        console.log(`   Origin: ${req.headers.origin}`);
        console.log(`   Expected Origin: ${clientUrl}`);
        console.log(`   Cookies Keys: ${Object.keys(req.cookies).join(', ')}`);
        console.log(`   Auth Header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
        if (req.headers.authorization) console.log(`   Auth Value: ${req.headers.authorization.substring(0, 15)}...`);
    }
    next();
});

// --- Observability (Latency Logger) ---
app.use((req, res, next) => {
    req.startTime = process.hrtime();
    res.on('finish', () => {
        const diff = process.hrtime(req.startTime);
        const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
        // Log formatted: Method URL Status Time
        if (req.originalUrl.startsWith('/api')) {
            console.log(`⏱️  ${req.method} ${req.originalUrl} [${res.statusCode}] - ${timeInMs}ms`);
        }
    });
    next();
});

// --- Apply Rate Limiter ---
// Only apply to API routes, not the redirect route (we want redirects to be fast and frequent)
app.use('/api/', distributedRateLimiter);

// --- Middleware: Ensure DB Connection (Critical for Serverless) ---
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('❌ Middleware DB Connect Error:', err);
        res.status(500).json({ error: 'Database Connection Failed' });
    }
});

// --- Mount Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/speed', speedRoutes);
app.use('/api/sync', syncRoutes);

// Root Health Check (Fixes 404 on base URL)
app.get('/', (req, res) => {
    res.send('NanoLink Backend is Running 🚀');
});

app.use('/', redirectRoutes); // Root level for /:code

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// --- Start Server (Only if not in Vercel) ---
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;