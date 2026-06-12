import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    accentColor: { // Added accentColor as per PROJ-01
      type: String,
      default: "#3B82F6", // Default to a nice blue (e.g., Tailwind blue-500)
    },
    status: {
        type: String,
        enum: ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"],
        default: "ACTIVE"
    },
    inviteToken: {
        type: String,
        unique: true,
        sparse: true // Allows null/missing values while keeping uniqueness for actual tokens
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    githubLink: {
      type: String,
      trim: true,
      default: "",
    },
    deployedLink: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectMember",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model("Project", projectSchema);