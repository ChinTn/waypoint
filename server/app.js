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

//Importing middleware
import { verifyJWT } from "./src/middlewares/auth.middleware.js";

// Import routes

//Public routes
import userRouter from "./src/routes/user.routes.js";
app.use("/api/v1/users", userRouter);

//Private routes
import projectRouter from "./src/routes/projects.routes.js"
app.use("/api/v1/projects", verifyJWT, projectRouter);

import taskRouter from "./src/routes/task.routes.js";
app.use("/api/v1/tasks", verifyJWT, taskRouter);

import notificationRouter from "./src/routes/notification.routes.js";
app.use("/api/v1/notifications", verifyJWT, notificationRouter);

import documentRouter from "./src/routes/document.routes.js";
app.use("/api/v1/documents", verifyJWT, documentRouter);

import flowRouter from "./src/routes/flow.routes.js";
app.use("/api/v1/flows", verifyJWT, flowRouter);

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