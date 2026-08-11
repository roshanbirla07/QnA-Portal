import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true,
        trim: true,
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QnA",
        required: true,
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
