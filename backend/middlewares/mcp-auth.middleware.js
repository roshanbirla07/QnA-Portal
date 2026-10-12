import crypto from "node:crypto";
import config from "../config/variables.js";

const constantTimeEqual = (left, right) => {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const mcpAuthMiddleware = (req, res, next) => {
  if (!config.mcpApiKey) {
    return res.status(503).json({ message: "MCP is not configured" });
  }

  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token || !constantTimeEqual(token, config.mcpApiKey)) {
    return res.status(401).json({ message: "Unauthorized MCP client" });
  }

  next();
};

export default mcpAuthMiddleware;
