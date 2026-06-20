import { notificationQueue } from "./queue.js";

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
        // We offload the heavy database write and socket emission to our BullMQ worker!
        // This makes the primary API request (like assigning a task) instantly return to the user.
        await notificationQueue.add("processNotification", {
            recipientId,
            type,
            message,
            projectId,
            taskId,
            actorId
        }, {
            removeOnComplete: true, // Keep Redis memory clean
            attempts: 3, // Retry up to 3 times if it fails
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });
        
        console.log(`🚀 Queued notification for user ${recipientId}`);
    } catch (error) {
        // We never want notification failures to crash the main request
        console.error("Failed to queue notification:", error.message);
    }
};
