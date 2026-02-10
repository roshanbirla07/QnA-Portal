import jwt from "jsonwebtoken";
import User from "../schemas/user.schema.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import config from "../stageconfig.js";

const generateToken = (userId, roleType) => {
  return jwt.sign({ userId, roleType }, config.jwtSecret, {
    expiresIn: "7d",
  });
};

const signupUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, roleType = "user" } = req.body;

    if (!email || !password || !roleType) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json(new ApiResponse(409, {}, "User already exists. Please login"));
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
      secure: config.nodeEnv === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { respUser, token }, "User signed up successfully"));
  } catch (error) {
    console.error("Signup Error:", error);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || "Something went wrong during signup"));
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "All fields are required");
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "User does not exist. Kindly signup"));
    }

    const isPasswordValid = await existingUser.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(403, "Invalid password");
    }

    const token = generateToken(existingUser._id, existingUser.roleType);
    const respUser = await User.findById(existingUser._id).select("-password");

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { respUser, token }, "User logged in successfully"));
  } catch (error) {
    console.error("Login Error:", error);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, {}, error.message || "Something went wrong during login"));
  }
});

// Logout Controller
const logoutUser = asyncHandler(async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: config.nodeEnv === "production",
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    console.error(error.message);
    return res.status(500).json(new ApiResponse(500, {}, "Something went wrong during logout"));
  }
});

export { signupUser, loginUser, logoutUser };
