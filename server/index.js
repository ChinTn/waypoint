import "dotenv/config";
import connectDB from "./src/db/index.js";
// 1. CHANGE: We import the 'server' from our new socket file instead of 'app' from app.js
import { server } from "./src/socket.js"; 
import { emailQueue, emailWorker } from "./src/utils/queue.js"; // Initialize BullMQ Email Queue & Worker
import { cronQueue, cronWorker, setupCronJobs } from "./src/utils/cron.js"; // Initialize Cron Jobs

const PORT = process.env.PORT || 8000;

connectDB()
.then(async () => {
    // Start BullMQ Cron Jobs
    await setupCronJobs();

    // 2. CHANGE: We tell 'server' to listen, not 'app'
    server.listen(PORT, () => {
        console.log(`⚙️ Server is running at port : ${PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});

// Graceful Shutdown for BullMQ (Step 2.3)
const gracefulShutdown = async (signal) => {
    console.log(`\n[${signal}] Shutting down server gracefully...`);
    
    try {
        console.log("Closing BullMQ workers...");
        await emailWorker.close();
        await cronWorker.close();
        console.log("Closing BullMQ queues...");
        await emailQueue.close();
        await cronQueue.close();
        console.log("Closing HTTP server...");
        server.close(() => {
            console.log("HTTP server closed.");
            process.exit(0);
        });
    } catch (err) {
        console.error("Error during shutdown", err);
        process.exit(1);
    }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));