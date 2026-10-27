import express from "express";
import { loginUser, logoutUser, signupUser } from "../controllers/user.controllers.js";

import { getAuthConfig, googleChallenge, googleSignIn } from "../controllers/google-auth.controllers.js";

const userRouter = express.Router();

userRouter.get("/auth-config", getAuthConfig);
userRouter.post("/google/challenge", googleChallenge);
userRouter.post("/google", googleSignIn);

userRouter.route("/signup").post(signupUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(logoutUser);

export default userRouter;