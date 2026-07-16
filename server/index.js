import "dotenv/config";
import connectDB from "./src/db/index.js";
// 1. CHANGE: We import the 'server' from our new socket file instead of 'app' from app.js
import { server } from "./src/socket.js"; 

const PORT = process.env.PORT || 8000;

connectDB()
.then(async () => {
    // 2. CHANGE: We tell 'server' to listen, not 'app'
    server.listen(PORT, () => {
        console.log(`⚙️ Server is running at port : ${PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n[${signal}] Shutting down server gracefully...`);
    
    try {
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