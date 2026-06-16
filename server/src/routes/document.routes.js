import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createDocument,
    getProjectDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument
} from "../controllers/document.controller.js";

const router = Router();

router.use(verifyJWT);

// Project level routes
router.route("/project/:projectId").get(getProjectDocuments).post(createDocument);

// Document level routes
router.route("/:documentId")
    .get(getDocumentById)
    .put(updateDocument)
    .delete(deleteDocument);

export default router;
