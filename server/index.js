import "dotenv/config";
import connectDB from "./src/db/index.js";
// 1. CHANGE: We import the 'server' from our new socket file instead of 'app' from app.js
import { server } from "./src/socket.js"; 

const PORT = process.env.PORT || 8000;

connectDB()
.then(() => {
    // 2. CHANGE: We tell 'server' to listen, not 'app'
    server.listen(PORT, () => {
        console.log(`⚙️ Server is running at port : ${PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});