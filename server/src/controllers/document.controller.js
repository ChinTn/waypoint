import { Document } from "../models/document.model.js";
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

export const getProjectDocuments = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    await checkMembership(projectId, req.user._id);

    const documents = await Document.find({ projectId })
        .select("-content") // Don't fetch full content for the list to save bandwidth
        .sort({ updatedAt: -1 })
        .populate("createdBy", "fullName avatar");

    return res.status(200).json(new ApiResponse(200, documents, "Documents fetched"));
});

export const getDocumentById = asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const document = await Document.findById(documentId).populate("createdBy", "fullName avatar");
    if (!document) throw new ApiError(404, "Document not found");
    
    await checkMembership(document.projectId, req.user._id);

    return res.status(200).json(new ApiResponse(200, document, "Document fetched"));
});

export const createDocument = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { title, content } = req.body;
    
    const membership = await checkMembership(projectId, req.user._id);
    if (membership.role === "VIEWER") throw new ApiError(403, "Viewers cannot create documents");

    const document = await Document.create({
        projectId,
        title: title || "Untitled Document",
        content: content || "",
        createdBy: req.user._id,
        updatedBy: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, document, "Document created"));
});

export const updateDocument = asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const { title, content } = req.body;

    const document = await Document.findById(documentId);
    if (!document) throw new ApiError(404, "Document not found");

    const membership = await checkMembership(document.projectId, req.user._id);
    if (membership.role === "VIEWER") throw new ApiError(403, "Viewers cannot edit documents");

    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    document.updatedBy = req.user._id;

    await document.save();

    return res.status(200).json(new ApiResponse(200, document, "Document updated"));
});

export const deleteDocument = asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    
    const document = await Document.findById(documentId);
    if (!document) throw new ApiError(404, "Document not found");

    const membership = await checkMembership(document.projectId, req.user._id);
    // Only Admin/Owner or the creator can delete it
    if (membership.role !== "OWNER" && membership.role !== "ADMIN" && document.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this document");
    }

    await Document.findByIdAndDelete(documentId);

    return res.status(200).json(new ApiResponse(200, {}, "Document deleted"));
});
