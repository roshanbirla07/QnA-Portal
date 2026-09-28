import crypto from "crypto";
import jwt from "jsonwebtoken";
import Post from "../schemas/post.schema.js";
import PostView from "../schemas/post-view.schema.js";
import config from "../config/variables.js";
import ApiError from "../utils/ApiError.js";

const VIEWER_COOKIE = "qnaViewerId";
const VIEWER_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

const resolveViewerKey = (req, res) => {
  const token = req.cookies?.authToken || req.headers.authorization?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      if (decoded?.userId) return `user:${decoded.userId}`;
    } catch {
      // Invalid/expired auth should not make a public view endpoint fail.
    }
  }

  let anonymousId = req.cookies?.[VIEWER_COOKIE];
  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
    res.cookie(VIEWER_COOKIE, anonymousId, {
      httpOnly: true,
      secure: Boolean(config.cookieSecure),
      sameSite: config.cookieSameSite || "lax",
      maxAge: VIEWER_COOKIE_MAX_AGE,
    });
  }

  return `anon:${anonymousId}`;
};

const recordUniquePostView = async ({ postId, viewerKey, type }) => {
  const filter = {
    _id: postId,
    status: "published",
    ...(type ? { type } : {}),
  };
  const post = await Post.findOne(filter);
  if (!post) throw new ApiError(404, "Post not found");

  try {
    await PostView.create({ postId: post._id, viewerKey });
  } catch (error) {
    if (error?.code === 11000) {
      return { post, recorded: false };
    }
    throw error;
  }

  post.views += 1;
  await post.save();

  return { post, recorded: true };
};

export { resolveViewerKey, recordUniquePostView };
