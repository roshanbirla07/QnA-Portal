import mongoose from "mongoose";

const reputationEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    enum: ["vote_changed"],
    required: true,
  },
  sourceType: {
    type: String,
    enum: ["post", "answer"],
    required: true,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  previousValue: {
    type: Number,
    enum: [-1, 0, 1],
    required: true,
  },
  nextValue: {
    type: Number,
    enum: [-1, 0, 1],
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

reputationEventSchema.index({ userId: 1, createdAt: -1 });
reputationEventSchema.index({ actorId: 1, createdAt: -1 });
reputationEventSchema.index({ sourceType: 1, sourceId: 1, createdAt: -1 });

const ReputationEvent = mongoose.model("ReputationEvent", reputationEventSchema);

export default ReputationEvent;
