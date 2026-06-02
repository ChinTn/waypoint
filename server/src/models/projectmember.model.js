import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
      default: "MEMBER",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent same user from being added twice to the same project
projectMemberSchema.index(
  { projectId: 1, userId: 1 },
  { unique: true }
);

export const ProjectMember = mongoose.model(
  "ProjectMember",
  projectMemberSchema
);