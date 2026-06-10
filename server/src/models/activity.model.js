import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectMember",
      required: true, // The person who made the change
    },
    actionType: {
      type: String,
      enum: ["STATUS_CHANGE", "PRIORITY_CHANGE", "ASSIGNEE_ADDED", "ASSIGNEE_REMOVED", "DUE_DATE_CHANGED", "CREATED", "COMMENT_ADDED", "FILE_UPLOADED"],
      required: true,
    },
    // To store what the field was before and what it was changed to
    oldValue: {
      type: mongoose.Schema.Types.Mixed, 
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Human readable message (e.g., "Raj moved task to In Progress")
    message: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true, // This automatically provides the timestamped feature requested in TASK-10
  }
);

export const Activity = mongoose.model("Activity", activitySchema);