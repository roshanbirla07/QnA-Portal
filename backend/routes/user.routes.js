import express from "express";
import { loginUser, logoutUser, signupUser } from "../controllers/user.controllers.js";

import { getAuthConfig, githubStart, githubComplete, githubLink, githubCancel } from "../controllers/github-auth.controllers.js";

const userRouter = express.Router();

userRouter.get("/auth-config", getAuthConfig);
userRouter.post("/github/start", githubStart);
userRouter.post("/github/complete", githubComplete);
userRouter.post("/github/link", githubLink);
userRouter.post("/github/cancel", githubCancel);

userRouter.route("/signup").post(signupUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(logoutUser);

export default userRouter;