import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

// Specific routes first
router.get("/users", protectRoute, getUsersForSidebar);
router.post("/send/:id", protectRoute, sendMessage);

// Parameterized routes last
router.get("/:id", protectRoute, getMessages);

export default router;