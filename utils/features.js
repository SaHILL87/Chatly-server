import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";

const cookieOption = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: "ChatApp" })
    .then((data) => {
      console.log(`Connected to DB : ${data.connection.host}`);
    })
    .catch((err) => {
      throw err;
    });
};

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res.status(code).cookie("ChatApp-token", token, cookieOption).json({
    sucess: true,
    user,
    message,
  });
};

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const userSockets = getSockets(users);

  io.to(userSockets).emit(event, data);
};

const uploadOnCloudinary = async (file = []) => {
  const uploadFilePromise = file.map(async (file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result);
        }
      );
    });
  });
  try {
    const results = await Promise.all(uploadFilePromise);
    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    return formattedResults;
  } catch (error) {
    console.log(error);
    throw new Error("Error Uploading File to Cloudinary", error);
  }
};

const deleteFilesFromCloudinary = async (public_ids) => {};

export {
  connectDB,
  sendToken,
  cookieOption,
  emitEvent,
  deleteFilesFromCloudinary,
  uploadOnCloudinary,
};
