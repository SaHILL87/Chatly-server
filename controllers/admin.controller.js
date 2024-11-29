import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { cookieOption } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from "jsonwebtoken";

const adminLogin = TryCatch(async (req, res, next) => {
  const { secretKey } = req.body;
  const isMatched = secretKey === process.env.SECRET_KEY;
  if (!isMatched) return next(new ErrorHandler("Wrong Secret Key", 401));

  const token = jwt.sign(secretKey, process.env.JWT_SECRET);

  return res
    .status(200)
    .cookie("Admin-token", token, { ...cookieOption, maxAge: 1000 * 1000 * 60 })
    .json({ sucess: true, message: "Welcome back, BOSS" });
});

const adminLogout = TryCatch(async (req, res, next) => {
  return res
    .status(201)
    .cookie("Admin-token", "", { ...cookieOption, maxAge: 0 })
    .json({ sucess: true, message: "Logged out sucessfully" });
});

const allUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({});

  const transformedUsers = users.map(
    async ({ _id, name, username, avatar }) => {
      const friendListLength = await Chat.find({
        members: _id,
        groupChat: false,
      });

      const groupListLength = await Chat.countDocuments({
        members: _id,
        groupChat: true,
      });

      return {
        _id,
        name,
        username,
        avatar: avatar.url,
        friends: friendListLength,
        groups: groupListLength,
      };
    }
  );

  const finalUsers = await Promise.all(transformedUsers);

  res.status(201).json({ sucess: true, finalUsers });
});

const allChats = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({})
    .populate("members", " avatar.url")

    .populate("creator", "name avatar.url");

  const transformedChats = chats.map(async (chat) => {
    const { _id, name, groupChat, creator, members = [] } = chat;

    const messagesLength = await Message.countDocuments({
      chat: chat._id,
    });

    return {
      _id,
      name,
      groupChat,
      avatar: members.slice(0, 3).map((member) => member.avatar.url),
      creator: {
        name: creator?.name || "None",
        avatar: creator?.avatar?.url || "",
      },
      totalMembers: members.length,

      members,
      messages: messagesLength,
    };
  });

  const finalChats = await Promise.all(transformedChats);

  res.status(201).json({ sucess: true, finalChats });
});

const allMessages = TryCatch(async (req, res) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");

  const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments,
      content,
      createdAt,
      chat: chat?._id || null,
      groupChat: chat?.groupChat || null,
      sender: sender
        ? {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar?.url || null,
          }
        : null,
    })
  );

  return res.status(200).json({
    success: true,
    messages: transformedMessages,
  });
});

// const getDashboardStats = TryCatch(async (req, res, next) => {
//   const [numberUsers, numberChats, numberMessages, groupsCount] =
//     await Promise.all([
//       User.countDocuments(),
//       Chat.countDocuments(),
//       Message.countDocuments(),
//       Chat.countDocuments({ groupChat: true }),
//     ]);

//   const stats = { groupsCount, numberUsers, numberMessages, numberChats };

//   const today = new Date();
//   const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//   const last7dayMessages = await Message.find({
//     createdAt: { $gte: last7days, $lt: today },
//   }).select("createdAt");

//   const messages = new Array(7).fill(0);

//   last7dayMessages.forEach((message) => {
//     const day = new Date(message.createdAt).getDay();
//     messages[day] += 1;
//   });

//   res.status(201).json({ sucess: true, stats, last7dayMessages, messages });
// });

const getDashboardStats = TryCatch(async (req, res) => {
  const [groupsCount, usersCount, messagesCount, totalChatsCount] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),
    ]);

  const today = new Date();

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const last7DaysMessages = await Message.find({
    createdAt: {
      $gte: last7Days,
      $lte: today,
    },
  }).select("createdAt");

  const messages = new Array(7).fill(0);
  const dayInMiliseconds = 1000 * 60 * 60 * 24;

  last7DaysMessages.forEach((message) => {
    const indexApprox =
      (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
    const index = Math.floor(indexApprox);

    messages[6 - index]++;
  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCount,
    messagesChart: messages,
  };

  return res.status(200).json({
    success: true,
    stats,
  });
});

const getAdminData = TryCatch(async (req, res, next) => {
  return res.status(200).json({
    admin: true,
  });
});
export {
  adminLogin,
  adminLogout,
  allUsers,
  allChats,
  allMessages,
  getAdminData,
  getDashboardStats,
};
