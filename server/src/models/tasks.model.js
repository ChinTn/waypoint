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

    // Nested subtasks support
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    depth: {
      type: Number,
      default: 0,
    },

    hasChildren: {
      type: Boolean,
      default: false,
    },

    subTaskCount: {
      type: Number,
      default: 0,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectMember",
      default: null,
    },

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
      enum: [
        "TODO",
        "IN_PROGRESS",
        "IN_REVIEW",
        "DONE",
        "BLOCKED",
      ],
      default: "TODO",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
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