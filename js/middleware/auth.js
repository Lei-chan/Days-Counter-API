import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";
import { User } from "../modelSchemas.js";

export const generateAccessToken = function (userId) {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

export const generateRefreshToken = function (userId) {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const verifyAccessToken = function (token) {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = function (token) {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

//Authentication middleware
export const authenticateToken = async function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    const err = new Error("Access token required");
    err.statusCode = 401;
    return next(err);
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    const err = new Error("Invalid or expired access token");
    err.statusCode = 403;
    return next(err);
  }

  req.user = await User.findById(decoded.userId);

  if (!req.user) {
    ///User already deleted
    const err = new Error("User not found");
    err.statusCode = 404;
    return next(err);
  }

  next();
};

export const hashNewPassword = async function (req, res, next) {
  try {
    const salt = await bcrypt.genSalt();
    req.body.newPassword = await bcrypt.hash(req.body.newPassword, salt);
    next();
  } catch (err) {
    next(err);
  }
};
