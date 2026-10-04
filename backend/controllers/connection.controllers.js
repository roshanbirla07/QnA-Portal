import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../schemas/user.schema.js";
import ConnectionRequest from "../schemas/connection-request.schema.js";

const purposes = ["expertise", "collaboration", "mentorship", "referral", "project"];

const create = asyncHandler(async (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const purpose = req.body?.purpose;
  const note = String(req.body?.note || "").trim();
  if (!username || username.length > 40 || !purposes.includes(purpose) || !note || note.length > 500) {
    throw new ApiError(400, "Choose a member, purpose and short note");
  }
  const recipient = await User.findOne({ username }).select("_id");
  if (!recipient) throw new ApiError(404, "Member not found");
  if (String(recipient._id) === req.user.id) throw new ApiError(400, "You cannot connect with yourself");
  try {
    const request = await ConnectionRequest.create({
      senderId: req.user.id, recipientId: recipient._id, purpose, note,
    });
    return res.status(201).json(new ApiResponse(201, request, "Connection request sent"));
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "A request for this purpose already exists");
    throw error;
  }
});

const listMine = asyncHandler(async (req, res) => {
  const [received, sent] = await Promise.all([
    ConnectionRequest.find({ recipientId: req.user.id }).sort({ createdAt: -1 }).limit(50)
      .populate("senderId", "username displayName avatar headline"),
    ConnectionRequest.find({ senderId: req.user.id }).sort({ createdAt: -1 }).limit(50)
      .populate("recipientId", "username displayName avatar headline"),
  ]);
  return res.status(200).json(new ApiResponse(200, { received, sent }, "Connection requests fetched"));
});

const respond = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw new ApiError(400, "Invalid request id");
  const status = req.body?.status;
  if (!["accepted", "declined", "canceled"].includes(status)) throw new ApiError(400, "Invalid response");
  const owner = status === "canceled" ? "senderId" : "recipientId";
  const request = await ConnectionRequest.findOneAndUpdate({
    _id: req.params.id, [owner]: req.user.id, status: "pending",
  }, { $set: { status, respondedAt: new Date() } }, { new: true });
  if (!request) throw new ApiError(404, "Pending request not found");
  return res.status(200).json(new ApiResponse(200, request, "Connection request updated"));
});

export { create, listMine, respond };
