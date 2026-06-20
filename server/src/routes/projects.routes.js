import { Router } from "express";
import { 
    createProject, 
    getUserProjects, 
    updateProjectStatus, 
    updateProject, 
    deleteProject,
    generateInviteToken,
    joinProjectWithToken,
    getProjectMembers,
    updateMemberRole,
    removeMember
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protected routes
router.use(verifyJWT);

// Create a new project
router.route("/").post(createProject);

// Get all projects for the logged-in user
router.route("/").get(getUserProjects);

// Edit basic project info
router.route("/:projectId").patch(updateProject);

// Delete project
router.route("/:projectId").delete(deleteProject);

// Update project status
router.route("/:projectId/status").patch(updateProjectStatus);

// Member Management & Invites
router.route("/join/:token").post(joinProjectWithToken);
router.route("/:projectId/invite").post(generateInviteToken);
router.route("/:projectId/members").get(getProjectMembers);
router.route("/:projectId/members/:memberId")
    .patch(updateMemberRole)
    .delete(removeMember);

export default router;