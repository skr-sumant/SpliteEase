import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createGroup,
  getGroups,
  updateGroup,
  getPendingInvitations,
  acceptInvitation,
  deleteGroup
} from "../controllers/groupControllers.js";

const router = express.Router();

router.post("/create", protect, createGroup);
router.get("/", protect, getGroups);
router.put("/:groupId", protect, updateGroup);
router.get("/pending-invites", protect, getPendingInvitations);
router.post("/accept-invite", protect, acceptInvitation);
router.delete("/:groupId", protect, deleteGroup);

export default router;