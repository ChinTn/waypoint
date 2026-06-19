import Redis from "ioredis";

//Create the Redis Connection
const redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379" , {
  maxRetriesPerRequest: null,
  // This is a specific setting required by BullMQ so that the queue doesn't crash if Redis momentarily drops connection.
  enableReadyCheck: false,
  
});

//Log connection errors
redisClient.on("error", (err) => {
  console.error("Redis connection error: ",err);
});

//Log successful connection
redisClient.on("ready", () => {
  console.log("Redis connected successfully");
});

export { redisClient };