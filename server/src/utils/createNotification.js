import { Notification } from "../models/notification.model.js";
import { getIO } from "../socket.js";

/**
 * Creates a notification in the database and pushes it to the user in real-time via Socket.io.
 * 
 * Previously this went through BullMQ (Redis queue → Worker → emit), but Upstash's serverless
 * Redis drops the persistent connection BullMQ workers need, causing notifications to silently
 * fail after the first one. Now we save + emit DIRECTLY — the same pattern task_updated uses.
 * 
 * @param {Object} params
 * @param {string} params.recipientId  - The User._id of the person receiving the notification
 * @param {string} params.type         - One of: TASK_ASSIGNED, TASK_UNASSIGNED, TASK_COMMENT, TASK_STATUS_CHANGED, PROJECT_INVITE
 * @param {string} params.message      - Human-readable notification message
 * @param {string} [params.projectId]  - The Project._id this notification is about
 * @param {string} [params.taskId]     - The Task._id this notification is about
 * @param {string} [params.actorId]    - The User._id of the person who triggered this
 */
import mongoose from "mongoose";

export const createNotification = async ({ recipientId, type, message, projectId, taskId, actorId, actorFullName, actorAvatar }) => {
    try {
        // 1. Generate an ID synchronously
        const newId = new mongoose.Types.ObjectId();

        // 2. Build optimistic payload
        const optimisticNotif = {
            _id: newId,
            recipient: recipientId,
            type,
            message,
            projectId: { _id: projectId }, // Frontend usually just needs the ID or we can pass name if needed
            actor: { _id: actorId, fullName: actorFullName, avatar: actorAvatar },
            read: false,
            taskId,
            createdAt: new Date(),
            sentAt: Date.now()
        };

        // 3. Emit real-time socket event IMMEDIATELY
        const io = getIO();
        if (io) {
            const roomName = `user_${recipientId.toString()}`;
            io.to(roomName).emit("new_notification", optimisticNotif);
        }

        console.log(`🔔 Optimistic Notification sent to user ${recipientId}`);

        // 4. Save to MongoDB directly in the background
        await Notification.create({
            _id: newId,
            recipient: recipientId,
            type,
            message,
            projectId,
            taskId,
            actor: actorId,
        });

    } catch (error) {
        // We never want notification failures to crash the main request
        console.error("Failed to create notification:", error.message);
    }
};
