import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import qnaRouter from "./routes/qna.routes.js";
import commentRouter from "./routes/comment.routes.js";
import postRouter from "./routes/post.routes.js";
import answerRouter from "./routes/answer.routes.js";
import interactionRouter from "./routes/interaction.routes.js";
import feedRouter from "./routes/feed.routes.js";
import profileRouter from "./routes/profile.routes.js";
import { RESPONSE_MESSAGES } from "./constants/responseMessages.js";
import config from "./stageconfig.js";

const app = express();
app.set("trust proxy", 1);

const isVercelQnaOrigin = (origin) => /^https:\/\/qn-a-hexa-wealth(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (config.corsOrigins.includes(origin)) return true;
  if (config.allowVercelPreviewOrigins && isVercelQnaOrigin(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// Legacy endpoints kept during migration.
app.use("/api/v1/user", userRouter);
app.use("/api/v1/qna", qnaRouter);
app.use("/api/v1/comment", commentRouter);

// Developer publishing platform APIs.
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/questions", answerRouter);
app.use("/api/v1/interactions", interactionRouter);
app.use("/api/v1/feed", feedRouter);
app.use("/api/v1/profiles", profileRouter);

app.get("/", (req, res) => res.status(200).json({ message: "service is running fine." }));
app.use("*", (req, res) => res.status(404).json({ statusCode: 404, message: RESPONSE_MESSAGES.PAGE_NOT_FOUND }));

export default app;
