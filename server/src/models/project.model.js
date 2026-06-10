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
      enum: ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"],
      default: "PLANNING",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectMember", 
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