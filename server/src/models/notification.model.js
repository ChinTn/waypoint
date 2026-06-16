import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The type of event that triggered this notification
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",       // You were assigned to a task
        "TASK_UNASSIGNED",     // You were removed from a task
        "TASK_COMMENT",        // Someone commented on your task
        "TASK_STATUS_CHANGED", // Status changed on a task you're assigned to
        "PROJECT_INVITE",      // You were invited to a project
      ],
      required: true,
    },
    // Human-readable message to display in the notification panel
    message: {
      type: String,
      required: true,
    },
    // Which project does this notification belong to (for navigation)
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    // Which task does this notification reference (for navigation)
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    // Who triggered the notification (e.g. "John assigned you...")
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Has the user seen this notification?
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups: "get all unread notifications for user X"
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
