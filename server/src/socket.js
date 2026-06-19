import { Server } from "socket.io";
import http from "http";
import { app } from "../app.js";
import { WebSocketServer } from 'ws'; 
import yUtils from 'y-websocket/bin/utils'; 
const { setupWSConnection } = yUtils; 

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


// --- NEW: Y.JS WEBSOCKET SERVER ---
const wss = new WebSocketServer({ noServer: true });
// Listen for HTTP upgrade requests
server.on('upgrade', (request, socket, head) => {
    // If the request is for our Y.js document collaboration...
    if (request.url.startsWith('/yjs')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});
// When a client connects to Y.js, let the library handle the document syncing automatically
wss.on('connection', (ws, req) => {
    console.log("📝 Y.js Collaborative Editor connected!");
    setupWSConnection(ws, req);
});


// 3. Listen for users connecting!
io.on("connection", (socket) => {
    console.log(`🟢 User Connected: ${socket.id}`);

    socket.on("join_user", (userId) => {
        const roomName = `user_${userId}`;
        socket.join(roomName);
        console.log(`🔔 NOTIF DEBUG: User ${userId} joined room "${roomName}" (socket: ${socket.id})`);
    });

    // NEW: Listen for the frontend joining with their user data!
    socket.on("join_project", async ({ projectId, user }) => {
        socket.join(projectId);
        // Save the user data directly inside the socket connection so we know who this is
        socket.data.user = user;
        socket.data.projectId = projectId;
        
        console.log(`👤 User ${user?.fullName} joined Project Room: ${projectId}`);

        // Fetch ALL current sockets inside this specific room
        const sockets = await io.in(projectId).fetchSockets();
        
        // Extract the user data from each socket
        const onlineUsers = sockets.map(s => s.data.user).filter(Boolean);
        
        // Remove duplicate users (in case they have multiple tabs open)
        const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u._id, u])).values());

        // Shout the updated list to EVERYONE in the room
        io.to(projectId).emit("online_users", uniqueUsers);
    });

    // When the user navigates away from a project board (without disconnecting)
    socket.on("leave_project", async (projectId) => {
        socket.leave(projectId);
        socket.data.projectId = null;
        console.log(`👋 Socket ${socket.id} left Project Room: ${projectId}`);

        // Update the online users list for everyone still in the room
        const sockets = await io.in(projectId).fetchSockets();
        const onlineUsers = sockets.map(s => s.data.user).filter(Boolean);
        const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u._id, u])).values());
        io.to(projectId).emit("online_users", uniqueUsers);
    });

    socket.on("disconnect", async () => {
        console.log(`🔴 User Disconnected: ${socket.id}`);
        const projectId = socket.data.projectId;
        
        if (projectId) {
            // When someone disconnects, their socket is automatically removed from the room.
            // We just need to fetch the remaining sockets and broadcast the new list!
            const sockets = await io.in(projectId).fetchSockets();
            const onlineUsers = sockets.map(s => s.data.user).filter(Boolean);
            const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u._id, u])).values());
            
            io.to(projectId).emit("online_users", uniqueUsers);
        }
    });
});
// 4. A helper function. We will use this in Step 2 inside your controllers 
// to "Shout" updates to the frontend!
export const getIO = () => io;

// Export the server to be used in index.js
export { server, io };