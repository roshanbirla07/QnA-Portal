import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import User from "../schemas/user.schema.js";
import config from "../stageconfig.js";
import logger from "../utils/logger.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.js";

const authMiddleware = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.authToken || req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new ApiError(401, "Authentication token missing");
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new ApiError(401, RESPONSE_MESSAGES.USER_NOT_FOUND);
      }

      if (requiredRoles.length && !requiredRoles.includes(user.roleType)) {
        throw new ApiError(403, "You do not have the necessary permissions");
      }

      req.user = {
        id: user.id,
        email: user.email,
        roleType: user.roleType,
      };

      next();
    } catch (error) {
      logger.warn("Authorization failed", { error: error.message, requiredRoles });
      return res.status(error.statusCode || 401).json({
        statusCode: error.statusCode || 401,
        message: error.message || RESPONSE_MESSAGES.UNAUTHORIZED,
      });
    }
  };
};

export default authMiddleware;
