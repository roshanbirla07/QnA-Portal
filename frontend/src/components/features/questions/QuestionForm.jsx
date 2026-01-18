import React, { useState } from "react";
import { postQuestion } from "../services/qna.api";
import { POST_QUESTION } from "../services/apis";
import { useNavigate } from "react-router-dom";

const QuestionForm = ({ setNewPostPopup, newPostPopup }) => {
  const [question, setQuestion] = useState("");
  const [tags, setTags] = useState("");
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault(); // Prevent default form submission
    console.log("before ", tags);
    const arrTags = tags.split(",").map((tag) => tag.trim()); // Trim whitespace
    console.log("after ", arrTags);

    const formData = {
      questionTitle: question,
      tags: arrTags,
    };
    postQuestion("POST", POST_QUESTION, formData, navigate);
    setNewPostPopup(false); // Close popup after submission
  };

  return (
    <>
      {newPostPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-6 text-center">Submit a Question</h2>
            <form className="space-y-4" onSubmit={submitHandler}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Statement
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the problem in detail"
                  rows="4"
                  onChange={(e) => setQuestion(e.target.value)}
                  value={question}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter tags separated by commas, e.g., "stock market, crypto, liquidity"`}
                    onChange={(e) => setTags(e.target.value)}
                    value={tags}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
                  onClick={() => setNewPostPopup(false)} // Close popup
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionForm;
