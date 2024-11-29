import { body, check, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

const registerValidator = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 5 })
    .withMessage("Username must be at least 5 characters long")
    .isAlphanumeric()
    .withMessage("Username can only contain letters and numbers"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("bio")
    .notEmpty()
    .withMessage("Bio is required")
    .trim()
    .isLength({ max: 150 })
    .withMessage("Bio cannot be more than 150 characters long"),
];

const logInValidator = () => [
  body("username").trim().notEmpty().withMessage("Username is required"),

  body("password").trim().notEmpty().withMessage("Password is required"),
];

const newGroupValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be 2-100"),
];

const addMemberValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members")
    .isArray({ min: 1, max: 97 })
    .withMessage("Members must be 1-97"),
];

const removeMemberValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
  body("userId", "Please Enter User ID").notEmpty(),
];

const chatIdValidator = () => [
  param("id").notEmpty().withMessage("Please enter the Chat ID"),
];

const validateHandler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(" , ");

  if (!errors.isEmpty()) {
    // return res.status(400).json({ errorMessages });
    next(new ErrorHandler(errorMessages, 400));
  } else {
    next();
  }
};

const renameValidator = () => [
  param("id", "Please Enter Chat ID").notEmpty(),
  body("name", "Please Enter New Name").notEmpty(),
];

const sendAttachmentsValidator = () => [
  body("chatId", "Please Enter Chat ID").notEmpty(),
];

const sendRequestValidator = () => [
  body("userId", "Please Enter User ID").notEmpty(),
];

const acceptRequestValidator = () => [
  body("requestId", "Please Enter Request ID").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please Add Accept")
    .isBoolean()
    .withMessage("Accept must be a boolean"),
];

const adminLoginValidator = () => [
  body("secretKey", "Please Enter Secret Key").notEmpty(),
];

export {
  acceptRequestValidator,
  addMemberValidator,
  adminLoginValidator,
  chatIdValidator,
  logInValidator,
  newGroupValidator,
  registerValidator,
  removeMemberValidator,
  renameValidator,
  sendAttachmentsValidator,
  sendRequestValidator,
  validateHandler,
};
