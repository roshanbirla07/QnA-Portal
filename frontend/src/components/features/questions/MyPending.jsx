import React, { useState, useEffect } from 'react';
import { approveQuestion, fetchQuestion } from '../services/qna.api';
import { APPROVE_QUESTION, PENDING_QUESTIONS } from '../services/apis';

const MyPending = () => {
  const token = localStorage.getItem('token');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Fetching pending questions...");
        const result = await fetchQuestion('GET', PENDING_QUESTIONS);
        setData(result); // fetchQuestion already returns the data
        console.log(result, "Fetched pending questions");
      } catch (err) {
        console.error("Error fetching pending questions:", err);
        setError(err.message); // Update state with error message
      } finally {
        setLoading(false); // Stop loading spinner
      }
    };

    fetchData();
  }, [token]);

  const handleApprove = async (questionId) => {
    try {
      await approveQuestion("POST", APPROVE_QUESTION, {
        questionId,
        status: "approved",
      });
      // Refresh the list after approval
      const result = await fetchQuestion('GET', PENDING_QUESTIONS);
      setData(result);
    } catch (err) {
      console.error("Error approving question:", err);
    }
  };

  const handleReject = async (questionId) => {
    try {
      await approveQuestion("POST", APPROVE_QUESTION, {
        questionId,
        status: "rejected",
      });
      // Refresh the list after rejection
      const result = await fetchQuestion('GET', PENDING_QUESTIONS);
      setData(result);
    } catch (err) {
      console.error("Error rejecting question:", err);
    }
  };

  if (!token) {
    return <div className="m-10">Please log in to view pending questions.</div>;
  }

  let admin = false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    admin = payload.roleType === "admin";
  } catch (e) {
    console.error("Error parsing token:", e);
  }

  if (loading) {
    return <div className="m-10">Loading...</div>;
  }

  if (error) {
    return <div className="m-10">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex flex-col m-10">
        {data?.length === 0 ? (
          <div className="text-gray-500">No pending questions found.</div>
        ) : (
          data?.map((value, index) => (
            <div key={value._id} className="my-5 border-b-2 py-5">
              <div className="text-2xl cursor-pointer hover:underline">
                Q{index + 1}. {value.questionTitle}
              </div>
              <div className="flex my-2">
                {value?.tags?.map((tt, idx) => (
                  <div key={idx} className="px-2 text-gray-600">{tt}</div>
                ))}
              </div>
              {admin && (
                <div className="flex">
                  <button
                    className="text-green-600 mt-2 hover:underline px-8"
                    onClick={() => handleApprove(value._id)}
                  >
                    Approve
                  </button>
                  <button
                    className="text-red-600 mt-2 hover:underline px-8"
                    onClick={() => handleReject(value._id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyPending;
