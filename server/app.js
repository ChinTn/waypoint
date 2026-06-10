import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", // Vite default port
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRouter from "./src/routes/user.routes.js";

// Routes declaration
app.use("/api/v1/users", userRouter);


app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message,
        errors: err.errors || [], // This will show exactly what failed!
        stack: process.env.NODE_ENV === "production" ? null : err.stack
    });
});
export { app };