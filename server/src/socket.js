import { Server } from "socket.io";
import http from "http";
import { app } from "../app.js";

// 1. We wrap your existing Express 'app' inside a core Node 'http' server.
// WebSockets require lower-level server access than Express provides by default.
const server = http.createServer(app);

// 2. We initialize the Socket.io engine and attach it to the server.
// We pass the exact same CORS settings that your Express app uses so React can connect safely.
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        credentials: true
    }
});

// 3. Listen for users connecting!
io.on("connection", (socket) => {
    console.log(`🟢 User Connected: ${socket.id}`);

    // NEW: Listen for the frontend telling us which project they opened
    socket.on("join_project", (projectId) => {
        // We use Socket.io's built-in room feature
        socket.join(projectId);
        console.log(`👤 User ${socket.id} joined Project Room: ${projectId}`);
    });

    socket.on("disconnect", () => {
        console.log(`🔴 User Disconnected: ${socket.id}`);
    });
});
// 4. A helper function. We will use this in Step 2 inside your controllers 
// to "Shout" updates to the frontend!
export const getIO = () => io;

// Export the server to be used in index.js
export { server, io };