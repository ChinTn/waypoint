import { Router } from "express";
import { createTask, getProjectTasks, updateTaskStatus, assignTask, unassignTask, getTaskById, getMyTasks } from "../controllers/task.controller.js";
import { addComment, getTaskComments } from "../controllers/comments.controller.js";
import { uploadTaskFile, getTaskFiles } from "../controllers/file.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Create a task
router.route("/").post(createTask);

// Get all tasks for a specific project
router.route("/project/:projectId").get(getProjectTasks);

// Get my tasks globally (MUST be placed before /:taskId to avoid route conflict)
router.route("/me").get(getMyTasks);

// Get single task details
router.route("/:taskId").get(getTaskById);

// Update a task (for Kanban drag & drop)
router.route("/:taskId/status").patch(updateTaskStatus);

// Assignments
router.route("/:taskId/assign").post(assignTask);
router.route("/:taskId/assign/:assigneeId").delete(unassignTask);

// Comments
router.route("/:taskId/comments").post(addComment).get(getTaskComments);

// Files
router.route("/:taskId/files").post(upload.single("file"), uploadTaskFile).get(getTaskFiles);

export default router;