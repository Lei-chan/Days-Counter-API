import {
  User,
  Room,
  RefreshToken,
  generalUpdateFields,
} from "./modelSchemas.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./middleware/auth.js";

const storeRefreshTokenDatabase = async (userId, refreshToken) =>
  await RefreshToken.create({
    userId,
    refreshToken,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, //7days
  });
};

const deleteOldRefreshToken = async (req, res) => {
  try {
    await deleteOldRefreshTokenDatabase(req, res);

    res.clearCookie("refreshToken");
  } catch (err) {
    err.message = `Error while deleting old refresh token, ${err}`;
    throw err;
  }
};

const deleteOldRefreshTokenDatabase = async (req, res) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;

    await RefreshToken.deleteOne({ refreshToken: refreshTokenCookie });
  } catch (err) {
    err.message = `Error while deleting old refresh token, ${err}`;
    throw err;
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

  await deleteOldRefreshTokenDatabase(req, res);

  setRefreshTokenCookie(res, newRefreshToken);
  await storeRefreshTokenDatabase(userId, newRefreshToken);

  res.json({
    accessToken: newAccessToken,
  });
};

export const saveUserDataBeforeUserLeaves = async (req, res, next) => {
  try {
    const userData = JSON.parse(req.body);
    const userId = userData._id;

    await User.findByIdAndUpdate(userId, userData);
  } catch (err) {
    next(err);
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

    await deleteOldRefreshTokenDatabase(req, res);

    setRefreshTokenCookie(res, refreshToken);
    await storeRefreshTokenDatabase(user._id, refreshToken);

    res.json({
      accessToken,
      user: {
        username: user.username,
        email: user.email,
        goals: user.goals,
        rooms: user.rooms,
        remainingDaysPrev: user.remainingDaysPrev,
        remainingDaysNow: user.remainingDaysNow,
        howManyTimesClick: user.howManyTimesClick,
        remainingDaysPrevRooms: user.remainingDaysPrevRooms,
        remainingDaysNowRooms: user.remainingDaysNowRooms,
        howManyTimesClickRooms: user.howManyTimesClickRooms,
      },
    });
  } catch (err) {
    if (err.name !== "ValidationError")
      err.message = "Server error during login";
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
      err.name = "DuplicateUserInfo";
      err.statusCode = 400;
      return next(err);
    }

    await User.create(req.body);

    const newUser = await User.findOne({ username, email })
      .select("-__v")
      .select("-password");

    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    setRefreshTokenCookie(res, refreshToken);
    await storeRefreshTokenDatabase(newUser._id, refreshToken);

    res.status(201).json({
      message: "User created successfully",
      accessToken,
      user: newUser,
    });
  } catch (err) {
    if (err.name !== "ValidationError" || err.name !== "ExpressValidatorError")
      err.message = "Server error while creating user";

    next(err);
  }
};

// export const getCurrentUser = async function (req, res, next) {
//   try {
//     const user = req.user;

//     if (!user) {
//       const err = new Error("User not found");
//       err.statusCode = 404;
//       return next(err);
//     }

//     res.json({
//       success: true,
//       user,
//     });
//   } catch (err) {
//     if (err.name !== "ValidationError")
//       err.message = "Server error while fetching user";

//     console.error("Error while fetching user", err);
//     next(err);
//   }
// };

export const updateUser = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    const updatedFields = Object.keys(req.body);

    if (updatedFields.includes("username")) {
      const alreadyExists = await User.findOne({
        ...req.body,
        email: user.email,
      });

      if (alreadyExists) {
        const err = new Error("The username and the email already exist");
        err.name = "DuplicateUserInfo";
        err.statusCode = 400;
        return next(err);
      }
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
      updatedFields,
    });
  } catch (err) {
    if (err.name !== "ValidationError" || err.name !== "ExpressValidatorError")
      err.message = "Server error while updating user";

    console.error("Error while updating user", err);
    next(err);
  }
};

export const updatePassword = async function (req, res, next) {
  try {
    const { curPassword, newPassword } = req.body;

    if (!curPassword || !newPassword) {
      const err = new Error("Current password and new password are required");
      err.statusCode = 400;
      return next(err);
    }

    const userId = req.user._id;

    const user = await User.findById(userId).select("password");

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    const isValidPassword = await user.comparePassword(curPassword);

    if (!isValidPassword) {
      const err = new Error("This password is incorrect. Please try again.");
      err.statusCode = 400;
      return next(err);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: newPassword },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password")
      .select("-__v");

    res.json({
      success: true,
      message: "Password updated successfully",
      updatedField: "password",
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async function (req, res, next) {
  try {
    await deleteOldRefreshToken(req, res);

    res.json({
      success: true,
      message: "User logged out successfully",
      user: req.user,
    });
  } catch (err) {
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
      err.name = "validationFailed";
      err.statusCode = 403;
      return next(err);
    }

    const deletedUser = await User.findByIdAndDelete(user._id).select(
      "-password"
    );

    await deleteOldRefreshToken(req, res);

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

export const createRoom = async function (req, res, next) {
  try {
    const { roomId, ...others } = req.body;

    if (!roomId) {
      const err = new Error("Please provide room id");
      err.statusCode = 400;
      return next(err);
    }

    const newRoom = await Room.create(req.body);

    res.status(201).json({
      success: true,
      room: newRoom,
      message: "Room created successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getRoom = async function (req, res, next) {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      const err = new Error("Room not found");
      err.statusCode = 404;
      return next(room);
    }

    res.json({
      success: true,
      message: "Got room successfully",
      room,
    });
  } catch (err) {
    next(err);
  }
};

export const updateRoom = async function (req, res, next) {
  try {
    const { roomId } = req.params;

    const updated = await Room.findOneAndUpdate({ roomId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      const err = new Error("Room not found");
      err.statusCode = 404;
      return next(err);
    }

    res.json({
      success: true,
      message: "Updated room successfully",
      room: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteRoom = async function (req, res, next) {
  try {
    const { roomId } = req.params;

    const deletedRoom = await Room.findOneAndDelete({ roomId });

    res.json({
      success: true,
      message: "Room deleted successfully",
      data: deletedRoom,
    });
  } catch (err) {
    next(err);
  }
};

export const findUserRoom = async function (req, res, next) {
  try {
    const { roomId } = req.params;

    const sharingRoom = await Room.findOne({ roomId });

    const sharingUsernames = sharingRoom?.usernames;

    res.json({
      success: true,
      message: sharingUsernames?.length
        ? "Find users for room successfully"
        : "No other users",
      usernames: sharingUsernames || [],
    });
  } catch (err) {
    next(err);
  }
};
