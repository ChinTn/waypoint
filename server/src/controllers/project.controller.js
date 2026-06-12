import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { User } from "../models/user.model.js";
import { z } from "zod";
import crypto from 'crypto';

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

  return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});


export const getUserProjects = asyncHandler(async (req, res) => {
  // 1. Find all memberships for the logged-in user
  const memberships = await ProjectMember.find({ userId: req.user._id })
    .populate({
      path: "projectId", // Pulls in the full project details
      select: "name description accentColor status members createdAt githubLink deployedLink",
    });

  // 2. Format the response to be clean for the frontend
  const projects = memberships.map(membership => ({
    ...membership.projectId._doc, // Spread the project data
    myRole: membership.role // Tell the frontend what role the user has
  }));

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

  // Delete project and memberships
  await Project.findByIdAndDelete(projectId);
  await ProjectMember.deleteMany({ projectId });

  return res.status(200).json(new ApiResponse(200, null, "Project deleted successfully"));
});

// ==========================================
// MEMBER MANAGEMENT & INVITES
// ==========================================

export const generateInviteToken = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Security: Only OWNER or ADMIN can generate invites
  const membership = await ProjectMember.findOne({ projectId, userId: req.user._id });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new ApiError(403, "Only Owners and Admins can generate invite links.");
  }

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  // Generate a random token
  const inviteToken = crypto.randomBytes(20).toString('hex');
  
  project.inviteToken = inviteToken;
  await project.save();

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

  return res.status(200).json(new ApiResponse(200, null, "Member removed successfully"));
});