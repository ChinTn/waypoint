import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { User } from "../models/user.model.js";
import { Task } from "../models/tasks.model.js";
import { TaskList } from "../models/tasklist.model.js";
import { Document } from "../models/document.model.js";
import { Flow } from "../models/flow.model.js";
import { Notification } from "../models/notification.model.js";
import { Activity } from "../models/activity.model.js";
import { TaskComment } from "../models/comments.model.js";
import { TaskFile } from "../models/files.model.js";
import { z } from "zod";
import crypto from 'crypto';
import { getIO } from "../socket.js";
import { redisClient } from "../utils/redis.js";
import { sendEmailInBackground } from "../utils/queue.js";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  accentColor: z.string().optional(),
  endDate: z.string().optional(),
  githubLink: z.string().optional(),
  deployedLink: z.string().optional(),
});

export const createProject = asyncHandler(async (req, res) => {
  // 1. Validate Input
  const validationResult = createProjectSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ApiError(400, "Validation failed", validationResult.error.issues);
  }

  const { name, description, accentColor, endDate, githubLink, deployedLink } = validationResult.data;

  // 2. Create the Project
  const project = await Project.create({
    name,
    description: description || "",
    accentColor: accentColor || "#ff5a00",
    startDate: new Date(),
    endDate: endDate ? new Date(endDate) : null,
    githubLink: githubLink || "",
    deployedLink: deployedLink || "",
    createdBy: req.user._id, // This is the logged-in user!
  });

  // 3. Add the creator as the "OWNER" in ProjectMember table
  const projectOwner = await ProjectMember.create({
    projectId: project._id,
    userId: req.user._id,
    role: "OWNER",
  });

  // 4. Add the member reference back to the project array
  project.members.push(projectOwner._id);
  await project.save();

  // Invalidate Redis cache
  await redisClient.del(`user:${req.user._id}:projects`);

  return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});


export const getUserProjects = asyncHandler(async (req, res) => {
  const cacheKey = `user:${req.user._id}:projects`;

  // 1. Check if we have cached projects in Redis
  const cachedProjects = await redisClient.get(cacheKey);
  if (cachedProjects) {
    return res.status(200).json(new ApiResponse(200, JSON.parse(cachedProjects), "Projects retrieved from cache"));
  }

  // 2. Find all memberships for the logged-in user
  const memberships = await ProjectMember.find({ userId: req.user._id })
    .populate({
      path: "projectId", // Pulls in the full project details
      select: "name description accentColor status members createdAt githubLink deployedLink",
    });

  // 3. Format the response to be clean for the frontend
  const projects = memberships.map(membership => ({
    ...membership.projectId._doc, // Spread the project data
    myRole: membership.role // Tell the frontend what role the user has
  }));

  // 4. Save to Redis cache for 60 seconds (TTL)
  await redisClient.set(cacheKey, JSON.stringify(projects), "EX", 60);

  return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

export const updateProjectStatus = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status } = req.body;

  if (!status || !["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  // Security: Verify user is an OWNER or ADMIN of this project
  const membership = await ProjectMember.findOne({
    projectId,
    userId: req.user._id
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new ApiError(403, "Access denied. Only Owners and Admins can update project status.");
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $set: { status } },
    { new: true }
  );

  if (!updatedProject) {
    throw new ApiError(404, "Project not found");
  }

  // Invalidate Redis cache
  await redisClient.del(`user:${req.user._id}:projects`);

  // Emit to all members of the project individually so their Dashboard updates instantly
  const members = await ProjectMember.find({ projectId });
  members.forEach((member) => {
      getIO().to(`user_${member.userId.toString()}`).emit("project_updated", updatedProject);
  });
  
  // Also emit to the project room for anyone currently inside the project board
  getIO().to(projectId).emit("project_updated", updatedProject);

  return res.status(200).json(new ApiResponse(200, updatedProject, "Project status updated"));
});

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description, accentColor, endDate, githubLink, deployedLink } = req.body;

  // Security: Verify user is the OWNER
  const membership = await ProjectMember.findOne({
    projectId,
    userId: req.user._id
  });

  if (!membership || membership.role !== "OWNER") {
    throw new ApiError(403, "Access denied. Only the Project Owner can edit project details.");
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { 
      $set: { 
        ...(name && { name }), 
        ...(description !== undefined && { description }), 
        ...(accentColor && { accentColor }), 
        ...(endDate !== undefined && { endDate }),
        ...(githubLink !== undefined && { githubLink }),
        ...(deployedLink !== undefined && { deployedLink })
      } 
    },
    { new: true }
  );

  if (!updatedProject) {
    throw new ApiError(404, "Project not found");
  }

  // Invalidate Redis cache
  await redisClient.del(`user:${req.user._id}:projects`);

  // Emit to all members of the project individually so their Dashboard updates instantly
  const members = await ProjectMember.find({ projectId });
  members.forEach((member) => {
      getIO().to(`user_${member.userId.toString()}`).emit("project_updated", updatedProject);
  });

  getIO().to(projectId).emit("project_updated", updatedProject);
  return res.status(200).json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Security: Verify user is the OWNER
  const membership = await ProjectMember.findOne({
    projectId,
    userId: req.user._id
  });

  if (!membership || membership.role !== "OWNER") {
    throw new ApiError(403, "Access denied. Only the Project Owner can delete this project.");
  }

  // 1. Fetch members BEFORE deleting them so we know who to notify via WebSockets
  const members = await ProjectMember.find({ projectId });

  // 2. Fetch tasks to delete task dependencies (comments, activities, files)
  const tasks = await Task.find({ projectId });
  const taskIds = tasks.map(t => t._id);

  // 3. CASCADE DELETES: Clean up all orphaned data referencing this project
  await Promise.all([
      Project.findByIdAndDelete(projectId),
      ProjectMember.deleteMany({ projectId }),
      Task.deleteMany({ projectId }),
      TaskList.deleteMany({ projectId }),
      Document.deleteMany({ projectId }),
      Flow.deleteMany({ projectId }),
      Notification.deleteMany({ projectId }),
      Activity.deleteMany({ taskId: { $in: taskIds } }),
      TaskComment.deleteMany({ taskId: { $in: taskIds } }),
      TaskFile.deleteMany({ taskId: { $in: taskIds } })
  ]);

  // 4. Invalidate Redis cache
  await redisClient.del(`user:${req.user._id}:projects`);

  // 5. Emit to all former members individually so their Dashboard updates instantly
  members.forEach((member) => {
      getIO().to(`user_${member.userId.toString()}`).emit("project_deleted", { projectId });
  });

  getIO().to(projectId).emit("project_deleted", { projectId });
  return res.status(200).json(new ApiResponse(200, null, "Project deleted successfully"));
});

// ==========================================
// MEMBER MANAGEMENT & INVITES
// ==========================================

export const generateInviteToken = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const email = req.body?.email;

  // Security: Only OWNER or ADMIN can generate invites
  const membership = await ProjectMember.findOne({ projectId, userId: req.user._id });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new ApiError(403, "Only Owners and Admins can generate invite links.");
  }

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  // Reuse existing token if it has one, otherwise generate
  const inviteToken = project.inviteToken || crypto.randomBytes(20).toString('hex');
  
  project.inviteToken = inviteToken;
  await project.save();

  if (email) {
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${inviteToken}`;
      sendEmailInBackground('SEND_INVITE_EMAIL', {
          email,
          projectName: project.name,
          inviteLink
      });
  }

  return res.status(200).json(new ApiResponse(200, { inviteToken }, "Invite token generated"));
});

export const joinProjectWithToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const project = await Project.findOne({ inviteToken: token });
  if (!project) throw new ApiError(404, "Invalid or expired invite link");

  // Check if user is already a member
  const existingMembership = await ProjectMember.findOne({ projectId: project._id, userId: req.user._id });
  if (existingMembership) {
    return res.status(200).json(new ApiResponse(200, project, "You are already a member of this project"));
  }

  // Create membership
  const newMember = await ProjectMember.create({
    projectId: project._id,
    userId: req.user._id,
    role: "MEMBER" // Default role for new members
  });

  // Add to project members array
  project.members.push(newMember._id);
  await project.save();

  // Invalidate cache so the invited user sees the new project on their dashboard instantly
  await redisClient.del(`user:${req.user._id}:projects`);

  return res.status(200).json(new ApiResponse(200, project, "Successfully joined the project"));
});

export const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Ensure requester is a member of the project
  const membership = await ProjectMember.findOne({ projectId, userId: req.user._id });
  if (!membership) throw new ApiError(403, "Access denied");

  const members = await ProjectMember.find({ projectId }).populate("userId", "fullName email avatar");
  
  return res.status(200).json(new ApiResponse(200, members, "Members fetched successfully"));
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params; // memberId is the ID of the ProjectMember document
  const { role } = req.body;

  if (!["ADMIN", "MEMBER", "VIEWER"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const requesterMembership = await ProjectMember.findOne({ projectId, userId: req.user._id });
  if (!requesterMembership || (requesterMembership.role !== "OWNER" && requesterMembership.role !== "ADMIN")) {
    throw new ApiError(403, "Only Owners and Admins can manage roles.");
  }

  const targetMembership = await ProjectMember.findById(memberId);
  if (!targetMembership || targetMembership.projectId.toString() !== projectId) {
    throw new ApiError(404, "Member not found in this project");
  }

  if (targetMembership.role === "OWNER") {
    throw new ApiError(403, "Cannot change the role of the Project Owner.");
  }

  // Admin cannot modify another Admin (only Owner can)
  if (requesterMembership.role === "ADMIN" && targetMembership.role === "ADMIN") {
     throw new ApiError(403, "Admins cannot modify other Admins.");
  }

  targetMembership.role = role;
  await targetMembership.save();

  // Invalidate cache for the user whose role was changed
  await redisClient.del(`user:${targetMembership.userId}:projects`);

  return res.status(200).json(new ApiResponse(200, targetMembership, "Role updated successfully"));
});

export const removeMember = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;

  const requesterMembership = await ProjectMember.findOne({ projectId, userId: req.user._id });
  if (!requesterMembership || (requesterMembership.role !== "OWNER" && requesterMembership.role !== "ADMIN")) {
    throw new ApiError(403, "Only Owners and Admins can remove members.");
  }

  const targetMembership = await ProjectMember.findById(memberId);
  if (!targetMembership || targetMembership.projectId.toString() !== projectId) {
    throw new ApiError(404, "Member not found in this project");
  }

  if (targetMembership.role === "OWNER") {
    throw new ApiError(403, "Cannot remove the Project Owner.");
  }

  if (requesterMembership.role === "ADMIN" && targetMembership.role === "ADMIN") {
     throw new ApiError(403, "Admins cannot remove other Admins.");
  }

  await ProjectMember.findByIdAndDelete(memberId);
  await Project.findByIdAndUpdate(projectId, { $pull: { members: memberId } });

  // Invalidate cache for the user who was removed so the project disappears from their dashboard
  await redisClient.del(`user:${targetMembership.userId}:projects`);

  // Emit a socket event to the removed user so their UI responds instantly
  getIO().to(`user_${targetMembership.userId.toString()}`).emit("project_deleted", { projectId });

  return res.status(200).json(new ApiResponse(200, null, "Member removed successfully"));
});