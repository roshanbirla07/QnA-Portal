import React, { useState, useEffect } from "react";
import { deleteQuestion } from "../../../services/qna.api";
import { APPROVED_QUESTIONS, DELETE_QUESTION } from "../../../services/apis";
import QuestionCard from "../../common/QuestionCard";
import { useNavigate } from "react-router-dom";

const MyPosts = () => {
    const token = localStorage.getItem("token");
    const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
    const { userId } = payload;
    
    // We already know user is author of their own posts by definition of this page
    const isAuthor = true; 
    
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchMyQuestions = async () => {
      try {
        const response = await fetch(APPROVED_QUESTIONS, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Failed to Fetch Data");
        }
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMyQuestions();
  }, [refreshKey]);

  const handleDelete = async (questionId) => {
    if(!window.confirm("Are you sure you want to delete this question?")) return;
    
    await deleteQuestion(
        "DELETE",
        DELETE_QUESTION,
        { questionId },
        () => {
            setRefreshKey((prev) => prev + 1);
        }
    );
  };
  
  const navigate = useNavigate();
  const handleEdit = (question) => {
       navigate(`/question`, { state: { question, editMode: true } });
  }


  return (
    <div className="min-h-screen bg-bg-primary pt-6 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8 border-b border-white/10 pb-4">
            My Questions
        </h1>

        {loading ? (
             <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-purple"></div>
             </div>
        ) : error ? (
            <div className="text-center text-red-400">Error: {error}</div>
        ) : (
            <>
                {data.length === 0 ? (
                    <div className="text-center text-text-muted py-12 bg-bg-secondary/50 rounded-lg border border-dashed border-gray-700">
                        You haven't posted any questions yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.map((question) => (
                            <QuestionCard 
                                key={question._id}
                                question={question} 
                                isAdmin={false}
                                isAuthor={true}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default MyPosts;
