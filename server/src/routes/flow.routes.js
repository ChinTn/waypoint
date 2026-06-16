import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getProjectFlow,
    updateProjectFlow
} from "../controllers/flow.controller.js";

const router = Router();

router.use(verifyJWT);

// Project level routes (only one master flow per project)
router.route("/project/:projectId")
    .get(getProjectFlow)
    .put(updateProjectFlow);

export default router;
