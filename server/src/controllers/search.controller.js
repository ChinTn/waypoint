import { Task } from "../models/tasks.model.js";
import { Document } from "../models/document.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import mongoose from "mongoose";

export const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.status(200).json({ projects: [], tasks: [], documents: [] });

        // 1. Find all project IDs the user is a member of
        const memberships = await ProjectMember.find({ userId: req.user._id });
        const projectIds = memberships.map(m => m.projectId);

        if (projectIds.length === 0) {
            return res.status(200).json({ projects: [], tasks: [], documents: [] });
        }

        // 2. Standard Regex search for Projects (since there aren't many projects usually)
        const projects = await Project.find({
            _id: { $in: projectIds },
            name: { $regex: q, $options: "i" }
        }).select("name accentColor").limit(5);

        // 3. Atlas Search Aggregation for Tasks
        const tasks = await Task.aggregate([
            {
                $search: {
                    index: "default",
                    text: {
                        query: q,
                        path: ["title", "description"],
                        fuzzy: { maxEdits: 1 } // Allows minor typos!
                    }
                }
            },
            { $match: { projectId: { $in: projectIds } } },
            { $limit: 5 },
            { $project: { title: 1, projectId: 1, status: 1 } }
        ]);

        // 4. Atlas Search Aggregation for Documents
        const documents = await Document.aggregate([
            {
                $search: {
                    index: "default",
                    text: {
                        query: q,
                        path: ["title", "content"],
                        fuzzy: { maxEdits: 1 }
                    }
                }
            },
            { $match: { projectId: { $in: projectIds } } },
            { $limit: 5 },
            { $project: { title: 1, projectId: 1 } }
        ]);

        res.status(200).json({ projects, tasks, documents });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Search failed" });
    }
};