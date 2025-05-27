import express from "express";
import { sendPayment, getBalance } from "../controllers/payment.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/send", protectRoute, sendPayment);
router.get("/balance/:userId", protectRoute, getBalance);

export default router; 