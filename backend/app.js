import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import qnaRouter from "./routes/qna.routes.js";
import commentRouter from "./routes/comment.routes.js";
import config from "./stageconfig.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin === "*" ? "http://localhost:3000" : config.corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

app.use(
  express.json({
    limit: "32kb",
  })
);

app.use(
  express.urlencoded({
    limit: "32kb",
    extended: true,
  })
);

app.use(express.static("public"));

app.use(cookieParser());

// app.options("*", (req, res) => {
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
//   res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN);
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   return res.status(200).end();
// });

app.use(express.static("public"));

app.use(cookieParser());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/qna", qnaRouter);
app.use("/api/v1/comment", commentRouter);

app.get("/", (req, res) => {
  return res.status(200).json({ message: "service is running fine." });
});
export default app;
