const { Redis } = require('@upstash/redis');

console.log('Redis Config Loaded');
console.log('URL:', process.env.UPSTASH_REDIS_REST_URL ? 'Defined' : 'Undefined');
console.log('Token:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'Defined' : 'Undefined');

const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = client;