import express from "express";
import {
  acceptFriendRequest,
  getMyNotifications,
  getMyProfile,
  login,
  logout,
  newUser,
  searchUser,
  sendFriendRequest,
  getMyFriends,
  updateAvatar,
} from "../controllers/user.controller.js";
import { singleAvatar } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  registerValidator,
  validateHandler,
  logInValidator,
  sendRequestValidator,
  acceptRequestValidator,
} from "../lib/validators.js";
const app = express.Router();
app.post("/new", singleAvatar, registerValidator(), validateHandler, newUser);
app.post("/login", logInValidator(), validateHandler, login);

//After this all the routes will need theuser to be logged in

app.use(isAuthenticated);
app.get("/me", getMyProfile);
app.get("/logout", logout);
app.get("/search", searchUser);
app.post(
  "/sendrequest",
  sendRequestValidator(),
  validateHandler,
  sendFriendRequest
);
app.put(
  "/acceptrequest",
  acceptRequestValidator(),
  validateHandler,
  acceptFriendRequest
);

app.get("/notifications", getMyNotifications);
app.get("/friends", getMyFriends);
app.put("/update-avatar", singleAvatar, validateHandler, updateAvatar);

export default app;
