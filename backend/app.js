import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import qnaRouter from "./routes/qna.routes.js";
import commentRouter from "./routes/comment.routes.js";
import { RESPONSE_MESSAGES } from "./constants/responseMessages.js";
import config from "./stageconfig.js";

const app = express();

app.set("trust proxy", 1);

const isVercelQnaOrigin = (origin) => {
  return /^https:\/\/qn-a-hexa-wealth(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (config.corsOrigins.includes(origin)) return true;

  if (config.allowVercelPreviewOrigins && isVercelQnaOrigin(origin)) return true;

  return false;
};

const corsOptions = {
  // origin: (origin, callback) => {
  //   if (isAllowedOrigin(origin)) return callback(null, true);

  //  return callback(null, false);
  // },
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/qna", qnaRouter);
app.use("/api/v1/comment", commentRouter);

app.get("/", (req, res) => {
  return res.status(200).json({ message: "service is running fine." });
});

app.use("*", (req, res) => {
  return res.status(404).json({ statusCode: 404, message: RESPONSE_MESSAGES.PAGE_NOT_FOUND });
});

export default app;
