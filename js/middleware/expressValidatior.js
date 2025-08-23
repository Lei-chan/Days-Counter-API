import { body, validationResult } from "express-validator";
import { User } from "../modelSchemas.js";

//Custom express validator
const emailExists = async (email, { req }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser && existingUser._id.toString() !== req.params?.id)
    throw new Error("Email already exists");
};

export const validateNewUser = [
  body("username")
    .trim()
    .isLength({ max: 12 })
    .withMessage("Name must be less that 12 characters"),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])/)
    .withMessage(
      "Please include at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character"
    ),
  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email")
    .custom(emailExists),
];

export const validateUserGeneral = [
  body("username")
    .optional({ checkFalsy: true })
    .isLength({ max: 12 })
    .withMessage("Name must be less that 12 characters"),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email")
    .custom(emailExists),
  body("goals").optional({ checkFalsy: true }),
  body("rooms").optional({ checkFalsy: true }),
];

export const validateUserPasswordUpdate = [
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])/)
    .withMessage(
      "Password must include at least one lowercase letter, one uppercase letter, one digit, and one special chatacter"
    ),
];

export const validateUserPasswordReset = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])/)
    .withMessage(
      "Password must include at least one lowercase letter, one uppercase letter, one digit, and one special chatacter"
    ),
];

export const handleValidatorErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error("Validation failed");
    err.name = "ExpressValidatorError";
    err.statusCode = 400;
    err.validationErrors = errors.array();

    return next(err);
  }

  next();
};
