require('dotenv').config();
const { Redis } = require('@upstash/redis');

console.log('--- Testing Upstash Redis Connection ---');
console.log('URL:', process.env.UPSTASH_REDIS_REST_URL);
// Mask token for security in logs
console.log('Token:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'Defined' : 'Missing');

const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

(async () => {
    try {
        console.log('Attempting to set key with expiry...');
        const data = { id: 1, title: "Test Todo" };
        await client.set('speed_test_data', JSON.stringify(data), { ex: 60 });
        console.log('✅ Set successful with EX: 60');

        console.log('Attempting to get key...');
        const value = await client.get('speed_test_data');
        console.log('Raw Value Type:', typeof value);
        console.log('Raw Value:', value);

        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        console.log('✅ Parsed Value:', parsed);

        await client.del('speed_test_data');
        console.log('✅ Delete successful');
    } catch (error) {
        console.error('❌ Redis Error:', error);
    }
})();
