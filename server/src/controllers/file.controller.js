import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/tasks.model.js";
import { TaskFile } from "../models/files.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const uploadTaskFile = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Verify membership and role (VIEWERs usually can't upload, but let's just check membership for now)
  const membership = await ProjectMember.findOne({
    projectId: task.projectId,
    userId: req.user._id
  });

  if (!membership) {
    throw new ApiError(403, "Access denied");
  }
  
  if (membership.role === "VIEWER") {
      throw new ApiError(403, "Viewers cannot upload files");
  }

  // Upload to cloudinary
  const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
  
  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload file to Cloudinary");
  }

  // Save metadata to DB
  const taskFile = await TaskFile.create({
    taskId,
    uploadedBy: membership._id,
    fileName: req.file.originalname,
    fileUrl: cloudinaryResponse.secure_url,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    publicId: cloudinaryResponse.public_id,
  });

  const populatedFile = await TaskFile.findById(taskFile._id).populate({
      path: 'uploadedBy',
      populate: { path: 'userId', select: 'fullName avatar' }
  });

  return res.status(201).json(new ApiResponse(201, populatedFile, "File uploaded successfully"));
});

export const getTaskFiles = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const membership = await ProjectMember.findOne({
    projectId: task.projectId,
    userId: req.user._id
  });

  if (!membership) {
    throw new ApiError(403, "Access denied");
  }

  const files = await TaskFile.find({ taskId }).populate({
      path: 'uploadedBy',
      populate: { path: 'userId', select: 'fullName avatar' }
  }).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, files, "Files fetched successfully"));
});
