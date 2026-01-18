import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { approvedQuestions, approveQuestion, deleteQuestion, editQuestion, fetchQuestions, pendingQuestions, postQuestion } from "../controllers/qna.controllers.js";
const qnaRouter = express.Router();

qnaRouter.route("/fetchQuestions").get(authMiddleware(["user", "admin"]), fetchQuestions);
// qnaRouter.route("/fetchQuestions").get(fetchQuestions);
qnaRouter.route("/postQuestion").post(authMiddleware(), postQuestion);
qnaRouter.route("/deleteQuestion").delete(authMiddleware(["user", "admin"]), deleteQuestion);
qnaRouter.route("/approveQuestion").post(authMiddleware(["admin"]), approveQuestion);
qnaRouter.route("/approvedQuestions").get(authMiddleware(["user", "admin"]), approvedQuestions);
qnaRouter.route("/pendingQuestions").get(authMiddleware(["user", "admin"]), pendingQuestions);
qnaRouter.route("/editQuestion/:questionId").patch(editQuestion);

export default qnaRouter;