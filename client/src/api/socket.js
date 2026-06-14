import { io } from 'socket.io-client'

const socket = io('http://localhost:8000', {
    autoConnect: false,
    withCredentials: true,
});
// autoConnect: false means we won't drain resources until the user actually opens a project!
export default socket;