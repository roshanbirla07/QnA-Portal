import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import User from "../schemas/user.schema.js";
import config from "../stageconfig.js";

const authMiddleware = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const token =
        req.cookies?.authToken || req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new ApiError(401, "Authentication token missing");
      }
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new ApiError(401, "User not found or token invalid");
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
      console.error(error.message);
      return res
        .status(error.statusCode || 401)
        .json({ statusCode: error.statusCode || 401, message: error.message });
    }
  };
};

export default authMiddleware;
