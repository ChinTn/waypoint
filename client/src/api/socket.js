import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const socket = io(API_URL, {
    autoConnect: false, // We connect manually when needed
    withCredentials: true,
    transports: ['websocket'] // Force WebSockets to bypass Render load balancer polling issues
});
// autoConnect: false means we won't drain resources until the user actually opens a project!
export default socket;