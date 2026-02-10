import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import qnaRouter from "./routes/qna.routes.js";
import commentRouter from "./routes/comment.routes.js";
import { RESPONSE_MESSAGES } from "./constants/responseMessages.js";
import config from "./stageconfig.js";

const app = express();

const allowedOrigins = config.corsOrigin.split(",");

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked"));
    }
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());

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
