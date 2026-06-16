import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";

// GET /api/v1/notifications — Fetch all notifications for the logged-in user
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate("actor", "fullName avatar")    // Who triggered it
        .populate("projectId", "name")           // Project name for the badge
        .sort({ createdAt: -1 })                 // Newest first
        .limit(50);                              // Cap at 50 to keep it fast

    return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched"));
});

// PATCH /api/v1/notifications/:id/read — Mark a single notification as read
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id }, // Security: only the owner can mark their own
        { isRead: true },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, notification, "Marked as read"));
});

// PATCH /api/v1/notifications/read-all — Mark ALL notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );

    return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});
