import mongoose, { SchemaTypes } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    goals: Array,
    remainingDaysPrev: Array,
    remainingDaysNow: Array,
    howManyTimesClick: Array,
    roomIds: Array,
  },
  {
    timestamps: true,
  }
);

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

const roomSchema = new mongoose.Schema({
  rooms: Array,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  try {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
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
export const generalUpdateFields = ["username", "email", "goals", "roomIds"];
export const User = mongoose.model("User", userSchema);
export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export const Room = mongoose.model("Room", roomSchema);
