import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "18kb" }));
app.use(express.urlencoded({ extended: true, limit: "18kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import

import userRouter from "./routes/user.routes.js";
import videoRoute from "./routes/video.routes.js";
// routers declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRoute);

export { app };
