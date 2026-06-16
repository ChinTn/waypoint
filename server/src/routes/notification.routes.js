import { Router } from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";

const router = Router();

// GET all notifications for the logged-in user
router.route("/").get(getNotifications);

// Mark a single notification as read
router.route("/:id/read").patch(markAsRead);

// Mark ALL notifications as read in one shot
router.route("/read-all").patch(markAllAsRead);

export default router;
