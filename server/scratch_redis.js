import Redis from 'ioredis';

const redisUrl = 'rediss://default:gQAAAAAAAftdAAIgcDFlMWRjMjNmNzA0ZTI0NTRhYThlMGMwM2MyOGIwZjIxMg@nice-civet-129885.upstash.io:6379';

const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
    process.exit(1);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis successfully');
    process.exit(0);
});
