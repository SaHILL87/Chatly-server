import { User } from "../models/user.js";
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";
import jwt from "jsonwebtoken";

const isAuthenticated = TryCatch((req, res, next) => {
  const token = req.cookies["ChatApp-token"];

  if (!token) {
    return next(new ErrorHandler("Please LogIn to Access this route", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = decodedData._id;
  next();
});

const adminIsAuthenticated = (req, res, next) => {
  const token = req.cookies["Admin-token"];
  if (!token) {
    return next(new ErrorHandler("Please LogIn to Access this route", 401));
  }
  const secretKey = jwt.verify(token, process.env.JWT_SECRET);

  const isMatched = secretKey === process.env.SECRET_KEY;
  if (!isMatched) return next(new ErrorHandler("Wrong Secret Key", 401));

  next();
};

const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const authToken = socket.request.cookies["ChatApp-token"];

    if (!authToken) {
      return next(new ErrorHandler("Please LogIn to Access this route", 401));
    }

    const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken._id);

    if (!user) {
      return next(new ErrorHandler("Please LogIn to Access this route", 401));
    }

    socket.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Please LogIn to Access this route", 401));
  }
};

export { isAuthenticated, adminIsAuthenticated, socketAuthenticator };
