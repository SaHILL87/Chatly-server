import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  addMembers,
  deleteChat,
  getChatDetails,
  getMessages,
  getMyChat,
  getMyGroups,
  leaveGroup,
  newGroupChat,
  removeMember,
  renameGroup,
  sendAttachment,
} from "../controllers/chat.controller.js";
import { attachmentsMulter } from "../middlewares/multer.js";
import {
  addMemberValidator,
  chatIdValidator,
  newGroupValidator,
  removeMemberValidator,
  sendAttachmentsValidator,
  renameValidator,
  validateHandler,
} from "../lib/validators.js";
const app = express.Router();

//After this all the routes will need theuser to be logged in

app.use(isAuthenticated);

app.post("/new", newGroupValidator(), validateHandler, newGroupChat);
app.get("/my", getMyChat);
app.get("/my/groups", getMyGroups);
app.put("/addmembers", addMemberValidator(), validateHandler, addMembers);
app.put(
  "/removemember",
  removeMemberValidator(),
  validateHandler,
  removeMember
);
app.delete("/leave/:id", chatIdValidator(), validateHandler, leaveGroup);
app.post(
  "/message",
  attachmentsMulter,
  sendAttachmentsValidator(),
  validateHandler,
  sendAttachment
);
app.get("/message/:id", chatIdValidator(), validateHandler, getMessages);
app
  .route("/:id")
  .get(chatIdValidator(), validateHandler, getChatDetails)
  .put(renameValidator(), validateHandler, renameGroup)
  .delete(chatIdValidator(), validateHandler, deleteChat);

export default app;
