import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/tasks.model.js";
import { TaskComment } from "../models/comments.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { z } from "zod";
import { getIO } from "../socket.js";
import { createNotification } from "../utils/createNotification.js";

const addCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export const addComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const validationResult = addCommentSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    throw new ApiError(400, "Validation failed", validationResult.error.issues);
  }

  const { content } = validationResult.data;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Ensure user is in the project and is NOT a VIEWER
  const membership = await ProjectMember.findOne({
    projectId: task.projectId,
    userId: req.user._id
  });

  if (!membership) {
    throw new ApiError(403, "Access denied");
  }

  if (membership.role === "VIEWER") {
    throw new ApiError(403, "Viewers cannot comment on tasks");
  }

  const comment = await TaskComment.create({
    taskId,
    authorId: membership._id,
    content
  });

  // Populate author details before returning
  const populatedComment = await TaskComment.findById(comment._id)
    .populate({
      path: 'authorId',
      populate: { path: 'userId', select: 'fullName avatar' }
    });

  getIO().to(task.projectId.toString()).emit("comment_added", { 
    taskId, 
    comment: populatedComment 
  });

  // NOTIFICATION: Notify all task assignees about the new comment (except the commenter)
  if (task.assignedTo?.length > 0) {
      const assignees = await ProjectMember.find({ _id: { $in: task.assignedTo } }).populate('userId', '_id');
      for (const assignee of assignees) {
          if (assignee.userId._id.toString() !== req.user._id.toString()) {
              await createNotification({
                  recipientId: assignee.userId._id,
                  type: "TASK_COMMENT",
                  message: `${req.user.fullName} commented on "${task.title}"`,
                  projectId: task.projectId,
                  taskId: task._id,
                  actorId: req.user._id,
              });
          }
      }
  }

  return res.status(201).json(new ApiResponse(201, populatedComment, "Comment added"));
});

export const getTaskComments = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Ensure user is in the project
  const membership = await ProjectMember.findOne({
    projectId: task.projectId,
    userId: req.user._id
  });

  if (!membership) {
    throw new ApiError(403, "Access denied");
  }

  const comments = await TaskComment.find({ taskId })
    .populate({
      path: 'authorId',
      populate: { path: 'userId', select: 'fullName avatar' }
    })
    .sort({ createdAt: 1 }); // Oldest first

  return res.status(200).json(new ApiResponse(200, comments, "Comments fetched"));
});
