import React from "react";
import { useNavigate } from "react-router-dom";
import { useState,useEffect } from "react";
import { APPROVED_QUESTIONS } from "../services/apis";
const MyPosts = () => {
  

  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const payload = JSON.parse(atob(token.split(".")[1]));
  const admin = payload.roleType === "admin";
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data...");
        const response = await fetch(APPROVED_QUESTIONS, {
          method: 'GET',
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        setData(result.data); // Update state with fetched data
        console.log(result, "Fetched data");
      } catch (err) {
        setError(err.message); // Update state with error message
      } finally {
        setLoading(false); // Stop loading spinner
      }
    };

    fetchData();
  }, []);
 
  const clickHandler = (question) => {
    console.log(question)
    navigate(`/question`, { state: { question } });
  };


  // Edit handler: Navigates to the edit page with the selected question details
  const editHandler = (question) => {
    navigate(`/edit-question/${question.id}`, { state: question });
  };

  const deleteHandler = (id) => {
    console.log(`Delete question with ID: ${id}`); // Example: Add your delete logic here
  };

  return (
    <div>
      <div className="flex flex-col m-10">
        {data.map((value) => (
          <div key={value._id} className="my-5 border-b-2 py-5" 
             onClick={() => clickHandler(value)}
          >
            <div className="text-2xl cursor-pointer hover:underline">Q. {value.questionTitle}</div>
            <div className="flex my-2">
              {value?.tags?.map((tt, idx) => (
                <div key={idx} className="px-2 text-gray-600">{tt}</div>
              ))}
            </div>
            {admin && (
              <div className="flex">
                <button
                  className="text-green-600 mt-2 hover:underline px-8"
                  onClick={() => editHandler(value)} // Pass the question details to editHandler
                >
                  Edit
                </button>
                <button
                  className="text-red-600 mt-2 hover:underline px-8"
                  onClick={() => deleteHandler(value.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPosts;
