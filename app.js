import express from "express";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import adminRoute from "./routes/admin.js";
import dotenv from "dotenv";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import { Server } from "socket.io";
import { createServer } from "http";
import {
  newMessage,
  newMessageAlert,
  START_TYPING,
  STOP_TYPING,
  USER_OFFLINE,
  USER_ONLINE,
} from "./constants/events.js";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
import cors from "cors";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middlewares/auth.js";
import { on } from "events";

dotenv.config({ path: "./.env" });

const port = process.env.PORT || 3000;
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adsasdsdfsdfsdfd";
const userSocketID = new Map();
export const envMode = process.env.NODE_ENV.trim();
connectDB(process.env.MONGO_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);

app.get("/", (req, res) => {
  res.send("This is / page");
});

// CORS middleware wrapper
// const allowCors = (fn) => async (req, res) => {
//   res.setHeader("Access-Control-Allow-Origin", process.env.FrontEnd_Domain);
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, OPTIONS, PATCH, DELETE, POST, PUT"
//   );

//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
//   );

//   if (req.method === "OPTIONS") {
//     res.status(200).end();
//     return;
//   }

//   return await fn(req, res);
// };

// allowCors(userRoute);
// allowCors(chatRoute);
// allowCors(adminRoute);

// Middleware for socket authentication
io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, async (err) => {
    await socketAuthenticator(err, socket, next);
  });
});

io.on("connection", (socket) => {
  const tempUser = socket.user;
  userSocketID.set(tempUser._id.toString(), socket.id);

  // Emit updated list of online users to all clients
  // const emitOnlineUsers = () => {
  //   const onlineUsersArray = Array.from(userSocketID.keys());
  //   console.log("Emitting online users:", onlineUsersArray);
  //   io.emit(USER_ONLINE, onlineUsersArray);
  // };
  // emitOnlineUsers();

  // console.log(`User connected: ${tempUser._id}`);
  socket.on(USER_ONLINE, () => {
    const onlineUsersArray = Array.from(userSocketID.keys());
    // console.log("Emitting online users:", onlineUsersArray);
    io.emit(USER_ONLINE, onlineUsersArray);
  });
  // Handle new message
  socket.on(newMessage, async ({ chat_id, message, members }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: tempUser._id,
        name: tempUser.name,
      },
      chat: chat_id,
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      content: message,
      sender: tempUser._id,
      chat: chat_id,
    };

    const membersSockets = getSockets(members);
    io.to(membersSockets).emit(newMessage, {
      chat_id,
      message: messageForRealTime,
    });
    io.to(membersSockets).emit(newMessageAlert, { chat_id });

    try {
      await Message.create(messageForDB);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on(START_TYPING, ({ members, chat_id }) => {
    const memberSockets = getSockets(members);
    socket.to(memberSockets).emit(START_TYPING, { chat_id });
  });

  socket.on(STOP_TYPING, ({ members, chat_id }) => {
    const memberSockets = getSockets(members);
    socket.to(memberSockets).emit(STOP_TYPING, { chat_id });
  });

  socket.on("disconnect", () => {
    userSocketID.delete(tempUser._id.toString());
    // console.log(`User disconnected: ${tempUser._id}`);
    const onlineUsersArray = Array.from(userSocketID.keys());
    io.emit(USER_OFFLINE, onlineUsersArray);
    // emitOnlineUsers();
  });
});

// Error middleware
app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`App is listening on port ${port} and ${process.env.NODE_ENV}`);
});

export { userSocketID };
