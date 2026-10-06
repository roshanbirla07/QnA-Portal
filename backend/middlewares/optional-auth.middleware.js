import jwt from "jsonwebtoken";
import User from "../schemas/user.schema.js";
import config from "../config/variables.js";
const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.authToken || req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId).select("_id roleType");
      if (user) req.user = { id: user.id, roleType: user.roleType };
    } catch { /* Public browsing remains available with an expired token. */ }
  }
  next();
};
export default optionalAuth;
