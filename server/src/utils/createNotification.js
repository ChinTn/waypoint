import { Notification } from "../models/notification.model.js";
import { getIO } from "../socket.js";

/**
 * Creates a notification in the database and pushes it to the user in real-time via Socket.io.
 * 
 * @param {Object} params
 * @param {string} params.recipientId  - The User._id of the person receiving the notification
 * @param {string} params.type         - One of: TASK_ASSIGNED, TASK_UNASSIGNED, TASK_COMMENT, TASK_STATUS_CHANGED, PROJECT_INVITE
 * @param {string} params.message      - Human-readable notification message
 * @param {string} [params.projectId]  - The Project._id this notification is about
 * @param {string} [params.taskId]     - The Task._id this notification is about
 * @param {string} [params.actorId]    - The User._id of the person who triggered this
 */
export const createNotification = async ({ recipientId, type, message, projectId, taskId, actorId }) => {
    try {
        // 1. Save it to the database
        const notification = await Notification.create({
            recipient: recipientId,
            type,
            message,
            projectId,
            taskId,
            actor: actorId,
        });

        // 2. Populate the actor's name and avatar so the frontend can display them instantly
        const populated = await Notification.findById(notification._id)
            .populate("actor", "fullName avatar")
            .populate("projectId", "name");

        // 3. Push it to the user's personal socket room in real-time!
        // Each user joins a room named after their own User._id when they connect.
        const roomName = `user_${recipientId.toString()}`;
        console.log(`📤 NOTIF DEBUG: Emitting to room "${roomName}", type: ${type}, message: ${message}`);
        getIO().to(roomName).emit("new_notification", populated);
    } catch (error) {
        // We never want notification failures to crash the main request
        console.error("Failed to create notification:", error.message);
    }
};
