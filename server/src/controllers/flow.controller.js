import { Flow } from "../models/flow.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Check if user is a project member
const checkMembership = async (projectId, userId) => {
    const membership = await ProjectMember.findOne({ projectId, userId });
    if (!membership) throw new ApiError(403, "Access denied");
    return membership;
};

export const getProjectFlow = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    await checkMembership(projectId, req.user._id);

    let flow = await Flow.findOne({ projectId });
    
    // If it doesn't exist yet, we can return empty arrays so the frontend can initialize
    if (!flow) {
        flow = {
            projectId,
            nodes: [],
            edges: []
        };
    }

    return res.status(200).json(new ApiResponse(200, flow, "Flow fetched"));
});

export const updateProjectFlow = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { nodes, edges } = req.body;

    const membership = await checkMembership(projectId, req.user._id);
    if (membership.role === "VIEWER") throw new ApiError(403, "Viewers cannot edit the flow canvas");

    // Upsert the flow document
    const flow = await Flow.findOneAndUpdate(
        { projectId },
        { 
            $set: { 
                nodes, 
                edges,
                updatedBy: req.user._id
            }   
        },
        { new: true, upsert: true }// Upsert means "Update it if it exists, or Insert (create) it if it doesn't." s
    );

    return res.status(200).json(new ApiResponse(200, flow, "Flow updated"));
});
