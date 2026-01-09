const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL
});

client.on('error', (err) => console.log('❌ Redis Cloud Error:', err));

module.exports = client;