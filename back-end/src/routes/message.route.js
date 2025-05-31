import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUsers,
  getMessages,
  sendMessage,
  deleteMessage,
  getAllMessages,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsers);
router.get("/", protectRoute, getAllMessages);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/delete/:id", protectRoute, deleteMessage);

export default router;
