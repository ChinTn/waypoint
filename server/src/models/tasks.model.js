import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    taskListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskList",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    // [UPDATED] Subtasks as a simple checkbox list (TASK-07)
    subtasks: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
      }
    ],
    // Nested subtasks support (Keeping your original implementation just in case)
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    depth: { type: Number, default: 0 },
    hasChildren: { type: Boolean, default: false },
    subTaskCount: { type: Number, default: 0 },

    // [UPDATED] Changed to an array to support Multiple Assignees (TASK-04)
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectMember",
      }
    ],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectMember",
      required: true,
    },
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectMember",
      },
    ],
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"],
      default: "TODO",
    },
    // [UPDATED] Added URGENT to priority enum (TASK-05)
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model("Task", taskSchema);