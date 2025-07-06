import express from "express";
import {
  createUser,
  getCurrentUser,
  login,
  refreshToken,
  updateUser,
  deleteUser,
  deleteUsers,
  deleteTokens,
  createRoom,
  findUserRoom,
  getRoom,
  updateRoom,
  deleteRooms,
} from "./controller.js";
import { authenticateToken } from "./middleware/auth.js";
import {
  validateNewUser,
  validateUserGeneral,
  validateUserPasswordUpdate,
  handleValidatorErrors,
} from "./middleware/expressValidatior.js";

const router = express.Router();

router.get("/user/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime,
  });
});

//For dev
router.delete("/user/deleteAll", deleteUsers);
router.delete("/user/deleteTokens", deleteTokens);

router.post("/user/login", login);

router.post("/user/refresh", refreshToken);

router.get("/user/get", authenticateToken, getCurrentUser);

router.post("/user/create", validateNewUser, handleValidatorErrors, createUser);

router.patch(
  "/user/update/general",
  authenticateToken,
  validateUserGeneral,
  handleValidatorErrors,
  updateUser
);

//Later
router.patch(
  "/user/update/password",
  authenticateToken,
  validateUserPasswordUpdate,
  handleValidatorErrors
);

router.delete("/user/delete", authenticateToken, deleteUser);

router.post("/room/create", createRoom);
router.get("/room/findUsers/:roomId", findUserRoom);
router.get("/room/:roomId", authenticateToken, getRoom);
router.patch("/room/update/:roomId", authenticateToken, updateRoom);

router.delete("/room/deleteAll", deleteRooms);

export default router;
