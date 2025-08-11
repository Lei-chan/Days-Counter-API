import express from "express";
import {
  // getCurrentUser,
  login,
  createUser,
  refreshToken,
  updateUser,
  logout,
  deleteUser,
  createRoom,
  findUserRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  updatePassword,
  saveUserDataBeforeUserLeaves,
} from "./controller.js";
import { authenticateToken, hashNewPassword } from "./middleware/auth.js";
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

router.post("/user/login", login);

router.post("/user/refresh", refreshToken);

// router.get("/user/get", authenticateToken, getCurrentUser);

router.post("/user/create", validateNewUser, handleValidatorErrors, createUser);

router.patch(
  "/user/update/general",
  authenticateToken,
  validateUserGeneral,
  handleValidatorErrors,
  updateUser
);

router.patch(
  "/user/update/password",
  authenticateToken,
  validateUserPasswordUpdate,
  handleValidatorErrors,
  hashNewPassword,
  updatePassword
);

router.post("/user/logout", authenticateToken, logout);

router.delete("/user/delete", authenticateToken, deleteUser);

router.post("/room/create", createRoom);
router.get("/room/findUsers/:roomId", findUserRoom);
router.get("/room/:roomId", authenticateToken, getRoom);
router.patch("/room/update/:roomId", authenticateToken, updateRoom);
router.delete("/room/delete/:roomId", authenticateToken, deleteRoom);

router.post("/user/saveUserData", saveUserDataBeforeUserLeaves);

export default router;
