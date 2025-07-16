import mongoose, { SchemaTypes } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      trim: true,
    },
    goals: [
      {
        title: String,
        date: String,
        comments: String,
        toDoLists: String,
        toDoListsCheckbox: Array,
        selected: Boolean,
      },
    ],
    remainingDaysPrev: Array,
    remainingDaysNow: Array,
    howManyTimesClick: Array,
    rooms: [
      {
        roomId: String,
        usernames: Array,
        title: String,
        date: String,
        comments: String,
        toDoLists: String,
        toDoListsCheckbox: Array,
      },
    ],
    remainingDaysPrevRooms: Array,
    remainingDaysNowRooms: Array,
    howManyTimesClickRooms: Array,
  },
  {
    timestamps: true,
  }
);

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  usernames: Array,
  title: String,
  date: String,
  comments: String,
  toDoLists: String,
  toDoListsCheckbox: Array,
});

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresIn: String,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    // console.log(salt, this.password);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  // console.log(candidatePassword, this.password);
  return await bcrypt.compare(candidatePassword, this.password);
};

// export const fields = Object.keys(userSchema.obj);
export const generalUpdateFields = ["username", "email", "goals", "rooms"];
export const User = mongoose.model("User", userSchema);
export const Room = mongoose.model("Room", roomSchema);
export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
