import { compare } from "bcrypt";
import { User } from "../models/user.js";
import {
  cookieOption,
  emitEvent,
  sendToken,
  uploadOnCloudinary,
} from "../utils/features.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { Request } from "../models/requests.js";
import { newRequestAlert, refetchChats } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";

const newUser = TryCatch(async (req, res, next) => {
  const { name, username, password, bio } = req.body;
  const file = req.file;
  if (!file) return next(new ErrorHandler("Please Upload an avatar", 400));

  const result = await uploadOnCloudinary([file]);

  const avatar = { public_id: result[0].public_id, url: result[0].url };
  const user = await User.create({
    name,
    bio,
    username,
    password,

    avatar,
  });
  sendToken(res, user, 201, "User created");
  // res.status(201).json({ message: "User created Sucessfully" });
});

const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid Username", 404));

  const isMatchingpassword = await compare(password, user.password);
  // const isMatchingpassword = password;

  if (!isMatchingpassword)
    return next(new ErrorHandler("Invalid Password", 404));
  sendToken(res, user, 200, `Welcome Back,${user.name}`);
});

const getMyProfile = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.user);
  if (!user) {
    return next(new ErrorHandler("User not found", 401));
  }
  res.status(201).json({ sucess: true, user });
});

const logout = TryCatch(async (req, res) => {
  return res
    .status(201)
    .cookie("ChatApp-token", "", { ...cookieOption, maxAge: 0 })
    .json({ sucess: true, message: "Logged out sucessfully" });
});
const searchUser = TryCatch(async (req, res, next) => {
  const { name = "" } = req.query;

  const myChats = await Chat.find({ groupChat: false, members: req.user });

  const allUsersFromMyChat = myChats.map((chat) => chat.members).flat();

  const allUsersExceptMeAndFriends = await User.find({
    _id: { $nin: allUsersFromMyChat },
    name: { $regex: name, $options: "i" },
  });

  const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));

  return res.status(201).json({ sucess: true, users });
});

const sendFriendRequest = TryCatch(async (req, res, next) => {
  const { userId } = req.body;

  const [sender, receiver] = await Promise.all([
    User.findById(req.user),
    User.findById(userId),
  ]);

  if (!sender || !receiver)
    return next(new ErrorHandler("User not found", 404));

  const existingRequest = await Request.findOne({
    $or: [
      { sender: sender._id, receiver: receiver._id },
      { sender: receiver._id, receiver: sender._id },
    ],
  });

  if (existingRequest)
    return next(new ErrorHandler("Request already sent!", 400));

  await Request.create({
    sender: req.user,
    receiver: userId,
  });

  emitEvent(req, newRequestAlert, [userId]);

  return res
    .status(201)
    .json({ sucess: true, message: "Friend Request sent sucessfully!!" });
});

const acceptFriendRequest = TryCatch(async (req, res, next) => {
  const { requestId, accept } = req.body;

  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!request) return next(new ErrorHandler("Request not found", 404));

  if (request.receiver._id.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not authorized to accept the request", 401)
    );

  if (!accept) {
    await request.deleteOne();
    return res
      .status(200)
      .json({ sucess: true, message: "Friend request Rejected" });
  }

  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
    }),
    request.deleteOne(),
  ]);

  emitEvent(req, refetchChats, members);

  return res.status(201).json({
    sucess: true,
    message: "Friend Request sent sucessfully!!",
    senderId: request.sender._id,
  });
});

const getMyNotifications = TryCatch(async (req, res) => {
  const requests = await Request.find({ receiver: req.user }).populate(
    "sender",
    "name avatar"
  );

  const allRequests = requests.map(({ _id, sender }) => ({
    _id,
    sender: { _id: sender._id, name: sender.name, avatar: sender.avatar.url },
  }));

  return res.status(201).json({
    sucess: true,
    allRequests,
  });
});

const getMyFriends = TryCatch(async (req, res) => {
  const chatId = req.query.chat_id;

  const chats = await Chat.find({
    members: req.user,
    groupChat: false,
  }).populate("members", "name avatar");

  const friends = chats.map(({ members }) => {
    const otherUser = getOtherMember(members, req.user);

    return {
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar.url,
    };
  });

  if (chatId) {
    const chat = await Chat.findById(chatId);

    const availableFriends = friends.filter(
      (friend) => !chat.members.includes(friend._id)
    );

    return res.status(200).json({
      success: true,
      friends: availableFriends,
    });
  } else {
    return res.status(200).json({
      success: true,
      friends,
    });
  }
});

const updateAvatar = TryCatch(async (req, res, next) => {
  const file = req.file;
  if (!file) return next(new ErrorHandler("Please Upload an avatar", 400));

  const result = await uploadOnCloudinary([file]);

  const avatar = { public_id: result[0].public_id, url: result[0].secure_url };
  const user = await User.findByIdAndUpdate(req.user, { avatar });
  return res.status(201).json({ sucess: true, user });
});

export {
  login,
  newUser,
  getMyProfile,
  logout,
  searchUser,
  sendFriendRequest,
  acceptFriendRequest,
  getMyNotifications,
  getMyFriends,
  updateAvatar,
};
