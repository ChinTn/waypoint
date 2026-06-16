import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/tasks.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { z } from "zod";
import { getIO } from "../socket.js";
import { createNotification } from "../utils/createNotification.js";

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const createTask = asyncHandler(async (req, res) => {
  const validationResult = createTaskSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ApiError(400, "Validation failed", validationResult.error.issues);
  }

  const { projectId, title, description, status, priority } = validationResult.data;

  // Security: Verify the user is actually a member of this project
  const membership = await ProjectMember.findOne({
    projectId,
    userId: req.user._id
  });

  if (!membership) {
    throw new ApiError(403, "You are not a member of this project");
  }

  const task = await Task.create({
    projectId,
    taskListId: projectId, // Fallback since taskLists aren't heavily used in Phase 1 Kanban
    title,
    description: description || "",
    status: status || "TODO",
    priority: priority || "MEDIUM",
    assignedBy: membership._id,
  });
  
  // REALTIME: Broadcast the newly created task to everyone in the project room
  getIO().to(projectId).emit("task_created", task);

  return res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

export const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Security: Verify membership before sending data
  const membership = await ProjectMember.findOne({
    projectId,
    userId: req.user._id
  });

  if (!membership) {
    throw new ApiError(403, "Access denied. You are not in this project.");
  }

  // Fetch all tasks for this project (sorted by position for Kanban dragging later)
  const tasks = await Task.find({ projectId }).sort({ position: 1, createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

// Used specifically for Drag and Drop (TASK-03)
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { status, position, priority, title, description, subtasks } = req.body; 

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

  // Update only the fields that were provided
  const updateFields = {};
  if (status) updateFields.status = status;
  if (position !== undefined) updateFields.position = position;
  if (priority) updateFields.priority = priority;
  if (title) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (subtasks !== undefined) updateFields.subtasks = subtasks;

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $set: updateFields },
    { new: true } // Avoid full document validation on legacy tasks
  ).populate({
      path: 'assignedTo',
      populate: { path: 'userId', select: 'fullName avatar' }
  });

  // Since updateTaskStatus only returns partial data, we might want to populate it fully. 
  // But for simple drag-and-drop, broadcasting the updated fields is usually enough!
  getIO().to(updatedTask.projectId.toString()).emit("task_updated", updatedTask);

  // NOTIFICATION: If the status changed, notify all assignees (except the person who made the change)
  if (status && updatedTask.assignedTo?.length > 0) {
      for (const member of updatedTask.assignedTo) {
          const userId = member?.userId?._id || member?.userId;
          if (userId && userId.toString() !== req.user._id.toString()) {
              await createNotification({
                  recipientId: userId,
                  type: "TASK_STATUS_CHANGED",
                  message: `${req.user.fullName} moved "${updatedTask.title}" to ${status}`,
                  projectId: updatedTask.projectId,
                  taskId: updatedTask._id,
                  actorId: req.user._id,
              });
          }
      }
  }

  return res.status(200).json(new ApiResponse(200, updatedTask, "Task updated"));
});

export const assignTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { assigneeId } = req.body; // ProjectMember ID of the person to assign

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const requesterMembership = await ProjectMember.findOne({
    projectId: task.projectId,
    userId: req.user._id
  });

  if (!requesterMembership) throw new ApiError(403, "Access denied");

  // RBAC logic: Only OWNER/ADMIN can assign to others. Anyone can assign to themselves.
  if (requesterMembership.role === "VIEWER") {
    throw new ApiError(403, "Viewers cannot assign tasks");
  }

  if (requesterMembership._id.toString() !== assigneeId) {
      if (requesterMembership.role !== "OWNER" && requesterMembership.role !== "ADMIN") {
          throw new ApiError(403, "Only Admins and Owners can assign tasks to other members");
      }
  }

  // Ensure assignee exists in project
  const assigneeMembership = await ProjectMember.findById(assigneeId);
  if (!assigneeMembership || assigneeMembership.projectId.toString() !== task.projectId.toString()) {
      throw new ApiError(400, "Assignee is not a member of this project");
  }

  // Add to assignedTo if not already there
  if (!task.assignedTo.some(id => id.toString() === assigneeId)) {
      task.assignedTo.push(assigneeId);
      await task.save();
  }

  await task.populate({
      path: 'assignedTo',
      populate: { path: 'userId', select: 'fullName avatar' }
  });

  getIO().to(task.projectId.toString()).emit("task_updated", task);

  // NOTIFICATION: Tell the assignee they've been assigned (but not if they assigned themselves)
  const assigneeUser = await ProjectMember.findById(assigneeId).populate('userId', '_id fullName');
  if (assigneeUser && assigneeUser.userId._id.toString() !== req.user._id.toString()) {
      await createNotification({
          recipientId: assigneeUser.userId._id,
          type: "TASK_ASSIGNED",
          message: `${req.user.fullName} assigned you to "${task.title}"`,
          projectId: task.projectId,
          taskId: task._id,
          actorId: req.user._id,
      });
  }

  return res.status(200).json(new ApiResponse(200, task, "Task assigned successfully"));
});

export const unassignTask = asyncHandler(async (req, res) => {
  const { taskId, assigneeId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const requesterMembership = await ProjectMember.findOne({
    projectId: task.projectId,
    userId: req.user._id
  });

  if (!requesterMembership) throw new ApiError(403, "Access denied");

  if (requesterMembership.role === "VIEWER") throw new ApiError(403, "Access denied");

  if (requesterMembership._id.toString() !== assigneeId) {
      if (requesterMembership.role !== "OWNER" && requesterMembership.role !== "ADMIN") {
          throw new ApiError(403, "Only Admins and Owners can remove assignments of other members");
      }
  }

  task.assignedTo = task.assignedTo.filter(id => id.toString() !== assigneeId);
  await task.save();

  await task.populate({
      path: 'assignedTo',
      populate: { path: 'userId', select: 'fullName avatar' }
  });

  getIO().to(task.projectId.toString()).emit("task_updated", task);
  return res.status(200).json(new ApiResponse(200, task, "Assignment removed"));
});

export const getMyTasks = asyncHandler(async (req, res) => {
    // 1. Get all memberships for this user across all projects
    const memberships = await ProjectMember.find({ userId: req.user._id });
    const membershipIds = memberships.map(m => m._id);

    // 2. Find all tasks where this user is an assignee
    const tasks = await Task.find({ assignedTo: { $in: membershipIds } })
        .populate('projectId', 'name description') // Fetch project details for the badge
        .populate({
            path: 'assignedTo',
            populate: { path: 'userId', select: 'fullName avatar' }
        })
        .sort({ createdAt: -1 });
        //A user can be a member of 5 different projects, giving them 5 different ProjectMember._id values. $in says "find tasks where assignedTo contains ANY of these IDs."
    return res.status(200).json(new ApiResponse(200, tasks, "My tasks fetched successfully"));
});

export const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    
    const task = await Task.findById(taskId).populate({
        path: 'assignedTo',
        populate: { path: 'userId', select: 'fullName avatar' }
    });

    if (!task) throw new ApiError(404, "Task not found");

    const membership = await ProjectMember.findOne({
        projectId: task.projectId,
        userId: req.user._id
    });

    if (!membership) throw new ApiError(403, "Access denied");

    return res.status(200).json(new ApiResponse(200, task, "Task details fetched"));
});