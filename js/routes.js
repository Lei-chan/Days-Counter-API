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
} from "./controller.js";
import { autheticateToken } from "./middleware/auth.js";
import {
  validateNewUser,
  validateUserGeneral,
  validateUserPasswordUpdate,
  handleValidatorErrors,
} from "./middleware/expressValidatior.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime,
  });
});

//For dev
router.delete("/deleteAll", deleteUsers);
router.delete("/deleteTokens", deleteTokens);

router.post("/login", login);

router.post("/refresh", refreshToken);

router.get("/get", autheticateToken, getCurrentUser);

router.post("/create", validateNewUser, handleValidatorErrors, createUser);

router.patch(
  "/update/general",
  autheticateToken,
  validateUserGeneral,
  handleValidatorErrors,
  updateUser
);

//Later
router.patch(
  "/update/password",
  autheticateToken,
  validateUserPasswordUpdate,
  handleValidatorErrors
);

router.delete("/delete", autheticateToken, deleteUser);

export default router;
