import React, { useEffect, useState } from "react";
import { fetchComments, postComment } from "../services/comment.api";
import { DELETE_QUESTION, EDIT_QUESTION, FETCH_COMMENTS, POST_COMMENT } from "../services/apis";
import { useLocation, useNavigate } from "react-router-dom";
import { deleteQuestion, editQuestion } from "../services/qna.api";

const QuestionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const payload = JSON.parse(atob(token.split(".")[1]));
  const admin = payload.roleType === "admin";
  const { userId } = payload; 
  const { question } = location.state || {};

  // State management hooks
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editMode, setEditMode] = useState(false); // For toggling edit mode
  const [updatedQuestion, setUpdatedQuestion] = useState(question?.questionTitle || "");
const [updatedTags, setUpdatedTags] = useState(question?.tags?.join(",") || "");

  // Redirect back to Home if no question is passed
  useEffect(() => {
    if (!question) {
      navigate("/");
    }
  }, [question, navigate]);

  // Fetch comments if a question is present
  useEffect(() => {
    if (question) {
      const fetchHandler = async () => {
        const response = await fetchComments(
          "GET",
          FETCH_COMMENTS + `/${question._id}`
        );
        setComments(response);
      };
      fetchHandler();
    }
  }, [question]);

  const handleAddComment = () => {
    const formData = {
      comment: newComment,
      questionId: question._id,
    };
    postComment("POST", POST_COMMENT, formData, () => {
      setRefreshKey((prev) => prev + 1);
    });
    setNewComment("");
    setShowCommentBox(false);
  };

  if (!question) {
    return null; // Return nothing if no question is present
  }

  const handleUpdateQuestion = async () => {
    const updatedData = {
      questionTitle: updatedQuestion,
      tags: updatedTags.split(",").map((tag) => tag.trim()),
    };
    console.log(updatedData)

   const response =  await editQuestion("POST", `${EDIT_QUESTION}/${question._id}`, updatedData); 
   question.questionTitle = updatedQuestion;
    question.tags = updatedData.tags;
    setEditMode(false); // Exit edit mode
  };

  return (
    <div className="p-5">
      {/* Question Section */}
      <div className="my-5 border-b-2 py-5">


      {editMode ? (
          <div>
            <textarea
              className="w-full p-2 border rounded mb-3"
              rows="3"
              value={updatedQuestion}
              onChange={(e) => setUpdatedQuestion(e.target.value)}
            ></textarea>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter tags separated by commas"
              value={updatedTags}
              onChange={(e) => setUpdatedTags(e.target.value)}
            />
            <div className="mt-2 flex space-x-2">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded"
                onClick={handleUpdateQuestion}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ):(
          <div>

        <div className="text-2xl font-semibold">
          Q. {question.questionTitle}
        </div>
        <div className="flex my-2">
          {question.tags.map((tt, idx) => (
            <div
              key={idx}
              className="px-3 py-1 bg-gray-200 rounded-full text-gray-700 mr-2"
            >
              {tt}
            </div>
          ))}
        </div>
           {( userId === question.author) && (
                
                <div className="flex">
                <button
                  className="text-blue-600 mt-2 hover:underline px-8"
                  onClick={() => setEditMode(true)} // Correct this line
                >
                  Edit
                </button>
                <button
                  className="text-red-600 mt-2 hover:underline px-8"
                  onClick={() => deleteQuestion("DELETE", DELETE_QUESTION, { questionId: question._id},  () => {
                    setRefreshKey((prev) => prev + 1); // Trigger re-fetch
                  })}
                
                >
                  Delete
                </button>
              </div>
              )}
              </div>
        )
              }
      </div>

      {/* Comments Section */}
      <div className="my-5">
        <h1 className="text-xl font-semibold">Comments</h1>
        <div className="my-3 space-y-2">
          {comments &&
            comments.map((comment) => (
              <div key={comment._id} className="p-3 border rounded bg-gray-100">
                {comment.comment}
              </div>
            ))}
        </div>
      </div>

      {/* Add Comment Section */}
      <div>
        {!showCommentBox && (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setShowCommentBox(true)}
          >
            Add Comment
          </button>
        )}
      </div>
      {showCommentBox && (
        <div className="mt-3">
          <textarea
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Write your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <div className="mt-2 flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded"
              onClick={handleAddComment}
            >
              Submit
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded"
              onClick={() => setShowCommentBox(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPage;
