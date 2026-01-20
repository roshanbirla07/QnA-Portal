import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteQuestion, fetchQuestion } from "../../../services/qna.api"; // Check if fetchQuestion is exported or use custom fetch
import { DELETE_QUESTION, FETCH_QUESTIONS } from "../../../services/apis";
import QuestionCard from "../../common/QuestionCard";
import { FiSearch, FiFilter } from "react-icons/fi";

const Home = () => {
  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const { roleType, userId } = payload;
  const admin = roleType === "admin";
  
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching questions...");
        // Using direct fetch as in previous code, or can use service wrapper if available
        const response = await fetch(FETCH_QUESTIONS, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const result = await response.json();
        setData(result.data); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
  
  const handleEdit = (question) => {
      // Navigate to edit page or open modal
      // For now assuming navigating to question page then edit
      // Or we can create specific edit route
       navigate(`/question`, { state: { question, editMode: true } });
  }

  const filteredData = data.filter(q => 
    q.questionTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-bg-primary pt-6 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero / Header Section */}
        <div className="mb-10 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4 animate-fade-in">
            Explore Questions
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8 animate-slide-up">
            Find answers, share knowledge, and collaborate with developers from around the world.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400 text-xl group-focus-within:text-primary-purple transition-colors" />
             </div>
             <input 
                type="text" 
                placeholder="Search questions by title or tags..." 
                className="input-field pl-12 shadow-lg shadow-primary-purple/5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
             <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <FiFilter />
                </button>
             </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
             <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-purple"></div>
             </div>
        ) : error ? (
            <div className="text-center text-red-400 bg-red-900/10 p-4 rounded-lg border border-red-900/20">
                Error: {error}
            </div>
        ) : (
             <>
                {filteredData.length === 0 ? (
                    <div className="text-center text-text-muted py-12">
                        No questions found matching your search.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.map((question) => (
                            <div key={question._id} className="animate-fade-in">
                                <QuestionCard 
                                    question={question} 
                                    isAdmin={admin}
                                    isAuthor={userId && (question.author?._id || question.author) && userId === (question.author?._id || question.author)}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                />
                            </div>
                        ))}
                    </div>
                )}
             </>
        )}
      </div>
    </div>
  );
};

export default Home;
