import jwt from "jsonwebtoken";
import User from "../schemas/user.schema.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import config from "../stageconfig.js";
import logger from "../utils/logger.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const generateToken = (userId, roleType) => {
  return jwt.sign({ userId, roleType }, config.jwtSecret, {
    expiresIn: "7d",
  });
};

const signupUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, roleType = "user" } = req.body;

    if (!email || !password || !roleType) {
      throw new ApiError(400, RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json(new ApiResponse(409, {}, RESPONSE_MESSAGES.USER_ALREADY_EXISTS));
    }

    const user = await User.create({
      email,
      password,
      roleType,
    });

    const respUser = await User.findById(user._id).select("-password");

    const token = generateToken(user._id, roleType);
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { respUser, token }, RESPONSE_MESSAGES.SIGNUP_SUCCESS));
  } catch (error) {
    logger.error("Signup error", { error: error.message });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.SIGNUP_FAILED));
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, RESPONSE_MESSAGES.ALL_FIELDS_REQUIRED);
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, RESPONSE_MESSAGES.USER_NOT_FOUND));
    }

    const isPasswordValid = await existingUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(403, RESPONSE_MESSAGES.INVALID_PASSWORD);
    }

    const token = generateToken(existingUser._id, existingUser.roleType);
    const respUser = await User.findById(existingUser._id).select("-password");

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { respUser, token }, RESPONSE_MESSAGES.LOGIN_SUCCESS));
  } catch (error) {
    logger.error("Login error", { error: error.message });
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || RESPONSE_MESSAGES.LOGIN_FAILED));
  }
});

// Logout Controller
const logoutUser = asyncHandler(async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none"
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
