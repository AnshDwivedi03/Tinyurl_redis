const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Imports
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const syncAnalytics = require('./services/analyticsSync');
const distributedRateLimiter = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const redirectRoutes = require('./routes/redirect');
const speedRoutes = require('./routes/speed'); // <--- New Import

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Databases
connectDB(); // MongoDB

(async () => {
    try {
        await redisClient.connect(); // Redis
        console.log('✅ Redis Connected (Cache Layer)');
        
        // Start Background Worker for Write-Behind Analytics
        syncAnalytics(); 
    } catch (error) {
        console.error('❌ Redis Connection Error:', error);
    }
})();

// --- Middleware ---
app.use(helmet()); // Security Headers
app.use(cors({
    origin: 'http://localhost:5173', // React Frontend URL
    credentials: true // Allow cookies
}));
app.use(express.json({ limit: '10kb' })); // Body parser with size limit
app.use(cookieParser()); // Parse cookies

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

// --- Mount Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/speed', speedRoutes); // <--- Mount Speed Routes
app.use('/', redirectRoutes); // Root level for /:code

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});