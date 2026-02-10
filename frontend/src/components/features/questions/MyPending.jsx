import React, { useState, useEffect } from "react";
import { PENDING_QUESTIONS, APPROVE_QUESTION } from "../../../services/apis"; // Need APPROVE_QUESTION api
import { approveQuestion } from "../../../services/qna.api"; // Need to export this
import QuestionCard from "../../common/QuestionCard";
import toast from "react-hot-toast";

const MyPending = () => {
    const token = localStorage.getItem("token");
    const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
    const { roleType } = payload;
    const isAdmin = roleType === "admin";

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Add refresh key
]
    useEffect(() => {
        const fetchPendingQuestions = async () => {
             try {
                const response = await fetch(PENDING_QUESTIONS, {
                    method: "GET",
                    credentials: "include",
                });
        
                if (!response.ok) {
                    throw new Error("Failed to Fetch Data");
                }
                const result = await response.json();
                setData(result.data);
              } catch (error) {
                console.error("Error fetching pending questions:", error);
                setError(error.message);
              } finally {
                setLoading(false);
              }
        };
        fetchPendingQuestions();
    }, [refreshKey]);

    const handleApprove = async (questionId) => {
        if(!window.confirm("Approve this question?")) return;
        try {
            const response = await approveQuestion("POST", APPROVE_QUESTION, { questionId, status: "approved" });
            toast.success(response.message || "Question approved successfully");
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            toast.error(error.message || "Unable to approve question");
        }
    };

    const handleReject = async (questionId) => {
        if(!window.confirm("Reject this question?")) return;
        try {
            const response = await approveQuestion("POST", APPROVE_QUESTION, { questionId, status: "rejected" });
            toast.success(response.message || "Question rejected successfully");
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            toast.error(error.message || "Unable to reject question");
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary pt-6 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-text-primary mb-8 border-b border-white/10 pb-4">
                    {isAdmin ? "Admin Dashboard - Pending Approvals" : "My Pending Questions"}
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
                                No pending questions.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.map((question) => (
                                    <QuestionCard 
                                        key={question._id}
                                        question={question}
                                        isAdmin={isAdmin}
                                        onApprove={isAdmin ? handleApprove : null}
                                        onReject={isAdmin ? handleReject : null}
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

export default MyPending;
