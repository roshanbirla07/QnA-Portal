import jwt from "jsonwebtoken";
import User from "../schemas/user.schema.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import config from "../config/variables.js";
import logger from "../utils/logger.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const generateToken = (userId, roleType) => {
  return jwt.sign({ userId, roleType }, config.jwtSecret, {
    expiresIn: "7d",
  });
};

const authCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const respondWithSession = async (user, res, status = 200, returnTo) => {
  const token = generateToken(user._id, user.roleType);
  const respUser = await User.findById(user._id).select("-password -githubSubject");
  res.cookie("authToken", token, authCookieOptions());
  return res.status(status).json(new ApiResponse(status, { respUser, token, ...(returnTo ? { returnTo } : {}) }, status === 201 ? RESPONSE_MESSAGES.SIGNUP_SUCCESS : RESPONSE_MESSAGES.LOGIN_SUCCESS));
};

const checkCredentialRequest = (req) => {
  if (!req.is("application/json") || (req.get("origin") && !config.corsOrigins?.includes(req.get("origin")))) {
    throw new ApiError(403, "This sign-in request is not allowed.");
  }
};

const signupUser = asyncHandler(async (req, res) => {
  try {
    checkCredentialRequest(req);
    const { email, password } = req.body || {};
    const roleType = "user";

    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      throw new ApiError(400, RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(409)
        .json(new ApiResponse(409, {}, RESPONSE_MESSAGES.USER_ALREADY_EXISTS));
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      roleType,
    });

    return await respondWithSession(user, res, 201);
  } catch (error) {
    logger.warn("Signup failed", { statusCode: error.statusCode || 500 });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error instanceof ApiError ? error.message : RESPONSE_MESSAGES.SIGNUP_FAILED));
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    checkCredentialRequest(req);
    const { email, password } = req.body || {};

    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
      throw new ApiError(400, RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED);
    }
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (!existingUser || !await existingUser.isPasswordCorrect(password)) {
      throw new ApiError(401, "Email or password is incorrect.");
    }
    return await respondWithSession(existingUser, res);
  } catch (error) {
    logger.warn("Login failed", { statusCode: error.statusCode || 500 });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error instanceof ApiError ? error.message : RESPONSE_MESSAGES.LOGIN_FAILED));
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: config.cookieSameSite
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, RESPONSE_MESSAGES.LOGOUT_SUCCESS));
  } catch (error) {
    logger.error("Logout error", { error: error.message });
    return res.status(500).json(new ApiResponse(500, {}, RESPONSE_MESSAGES.LOGOUT_FAILED));
  }
});

export { signupUser, loginUser, logoutUser };
