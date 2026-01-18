import mongoose from "mongoose";

const qnaSchema = new mongoose.Schema({
  questionTitle: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
    validate: [arrLimit, "{PATH} exceeds the limit of 10"],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "approved", "rejected"],
  },
  views: {
    type: Number,
    default: 0,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for answer count (will be populated via aggregation)
qnaSchema.virtual('answerCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'questionId',
  count: true
});

function arrLimit (val) {
    return val.length <= 10;
}

const QnA = mongoose.model("QnA", qnaSchema);

export default QnA;