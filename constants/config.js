import dotenv from "dotenv";
dotenv.config();

export const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

console.log(process.env.CLIENT_URL);
