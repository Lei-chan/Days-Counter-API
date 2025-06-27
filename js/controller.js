import { User, RefreshToken, generalUpdateFields } from "./modelSchemas.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./middleware/auth.js";

const storeRefreshToken = async (userId, refreshToken) =>
  await RefreshToken.create({
    userId,
    refreshToken,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });

const setRefreshTokenCookie = (res, refreshToken) =>
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, //7days
  });

const deleteOldRefreshToken = async (req, res) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;
    await RefreshToken.deleteOne({ refreshToken: refreshTokenCookie });
    res.clearCookie("refreshToken");
  } catch (err) {
    err.message = `Error while deleting old refresh token, ${err}`;
    throw err;
  }
};

//For dev
export const deleteUsers = async function (req, res, next) {
  try {
    const deleted = await User.deleteMany();

    res.json({
      success: true,
      message: "Users deleted successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("Error while deleting users", err);
  }
};

export const deleteTokens = async function (req, res, next) {
  try {
    const deleted = await RefreshToken.deleteMany();

    res.clearCookie(req.cookies.refreshToken);

    res.json({
      success: true,
      message: "tokens deleted successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("Error while deleting tokens", err);
  }
};

export const login = async function (req, res, next) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select("+password");

    const isValidPassword = await user?.comparePassword(password);

    if (!user || !isValidPassword) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    //Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // add refreshToken to database
    await storeRefreshToken(user._id, refreshToken);

    setRefreshTokenCookie(res, refreshToken);

    await deleteOldRefreshToken(req, res);

    console.log(
      "This should be always null",
      await RefreshToken.findOne({ refreshToken: req.cookies.refreshToken })
    );

    res.json({
      accessToken,
      user: { id: user._id, username },
    });
  } catch (err) {
    if (err.name !== "ValidationError")
      // err.message = "Server error during login";
      next(err);
  }
};

export const refreshToken = async function (req, res, next) {
  const refreshTokenCookie = req.cookies.refreshToken;

  if (!refreshTokenCookie) {
    const err = new Error("Refresh token required");
    err.statusCode = 401;
    return next(err);
  }

  const refreshTokenDatabase = await RefreshToken.findOne({
    refreshToken: refreshTokenCookie,
  });

  if (!refreshTokenDatabase) {
    const err = new Error("Invalid refresh token");
    err.statusCode = 403;
    return next(err);
  }

  const decoded = verifyRefreshToken(refreshTokenCookie);
  if (!decoded) {
    //Remove invalid token
    await deleteOldRefreshToken(req, res);

    const err = new Error("Invalid refresh token");
    err.statusCode = 403;
    return next(err);
  }

  const userId = decoded.userId;

  const newAccessToken = generateAccessToken(userId);
  const newRefreshToken = generateRefreshToken(userId);

  setRefreshTokenCookie(res, newRefreshToken);
  await storeRefreshToken(userId, newRefreshToken);

  await deleteOldRefreshToken(req, res);

  console.log(
    "This should be always null",
    await RefreshToken.findOne({ userId, refreshToken: refreshTokenCookie })
  );

  res.json({
    accessToken: newAccessToken,
  });
};

export const getCurrentUser = async function (req, res, next) {
  try {
    const user = req.user;

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    if (err.name !== "ValidationError")
      err.message = "Server error while fetching user";

    console.error("Error while fetching user", err);
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      username,
      email,
    });

    if (existingUser) {
      const err = new Error("The username and the email already exist");
      err.statusCode = 400;
      err.name = "DuplicateUserInfo";
      return next(err);
    }

    await User.create(req.body);

    const newUser = await User.findOne({ username, email })
      .select("-__v")
      .select("-password");

    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    await storeRefreshToken(newUser._id, refreshToken);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: "User created successfully",
      accessToken,
      user: newUser,
    });
  } catch (err) {
    console.error(err.name, "😭😭😭");
    if (err.name !== "ValidationError" || err.name !== "ExpressValidatorError")
      err.message = "Server error while creating user";

    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, req.body, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .select("-__v");

    res.json({
      message: "User updated successfully",
      user: updatedUser,
      // updatedFields,
    });
  } catch (err) {
    if (err.name !== "ValidationError" || err.name !== "ExpressValidatorError")
      err.message = "Server error while updating user";

    console.error("Error while updating user", err);
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = req.user;
    const { password } = req.body;

    const userWithPassword = await User.findById(user._id).select("+password");

    const isValidPassword = await userWithPassword.comparePassword(password);

    if (!isValidPassword) {
      const err = new Error("Invalid password was enterd");
      err.statusCode = 403;
      return next(err);
    }

    const deletedUser = await User.findByIdAndDelete(user._id).select(
      "-password"
    );

    await deleteOldRefreshToken(req, res);
    console.log(
      "This should be always null",
      RefreshToken.findOne({ refreshToken: req.cookies.refreshToken })
    );

    res.json({
      success: true,
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (err) {
    err.message = "Server error while deleting user";

    console.error("Error while deleting user", err);
    next(err);
  }
};
