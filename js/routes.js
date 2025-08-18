import express from "express";
import {
  refreshToken,
  saveUserDataBeforeUserLeaves,
  login,
  createUser,
  // getCurrentUser,
  updateUser,
  updatePassword,
  logout,
  deleteUser,
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  findUserRoom,
} from "./controller.js";
import { authenticateToken, hashNewPassword } from "./middleware/auth.js";
import {
  validateNewUser,
  validateUserGeneral,
  validateUserPasswordUpdate,
  handleValidatorErrors,
} from "./middleware/expressValidatior.js";

const router = express.Router();

//For dev
router.get("/user/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime,
  });
});

router.post("/user/refresh", refreshToken);
router.post("/user/saveUserData", saveUserDataBeforeUserLeaves);

/////User
router.post("/user/login", login);
router.post("/user/create", validateNewUser, handleValidatorErrors, createUser);
// router.get("/user/get", authenticateToken, getCurrentUser);
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

//////Rooms
router.post("/room/create", createRoom);
router.get("/room/:roomId", authenticateToken, getRoom);
router.patch("/room/update/:roomId", authenticateToken, updateRoom);
router.delete("/room/delete/:roomId", authenticateToken, deleteRoom);
router.get("/room/findUsers/:roomId", findUserRoom);

export default router;
