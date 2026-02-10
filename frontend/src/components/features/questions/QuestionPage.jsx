import React, { useEffect, useState } from "react";
import { fetchComments, postComment } from "../../../services/comment.api";
import { DELETE_QUESTION, EDIT_QUESTION, FETCH_COMMENTS, POST_COMMENT, INCREMENT_VIEW } from "../../../services/apis";
import { useLocation, useNavigate } from "react-router-dom";
import { deleteQuestion, editQuestion, incrementView } from "../../../services/qna.api";
import { FiClock, FiMessageSquare, FiEye, FiShare2, FiEdit2, FiTrash2, FiSend, FiCheck } from "react-icons/fi"; 
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const QuestionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const { userId } = payload;
  const { question } = location.state || {};

  // State management
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editMode, setEditMode] = useState(location.state?.editMode || false);
  const [updatedQuestion, setUpdatedQuestion] = useState(question?.questionTitle || "");
  const [updatedTags, setUpdatedTags] = useState(question?.tags?.join(", ") || "");
  
  // Stats state (local state to show immediate updates)
  const [views, setViews] = useState(question?.views || 0);

  // Redirect if no question
  useEffect(() => {
    if (!question) {
      navigate("/");
    }
  }, [question, navigate]);

  // Increment view on mount
  useEffect(() => {
      if(question?._id) {
          incrementView("PATCH", `${INCREMENT_VIEW}/${question._id}`)
            .then(() => setViews(v => v + 1))
            .catch((err) => toast.error(err.message || "Failed to increment view"));
      }
  }, [question?._id]);

  // Fetch comments
  useEffect(() => {
    if (question) {
      const fetchHandler = async () => {
        try {
            const response = await fetchComments(
            "GET",
            FETCH_COMMENTS + `/${question._id}`
            );
            setComments(response);
        } catch (error) {
            console.error(error);
        }
      };
      fetchHandler();
    }
  }, [question, refreshKey]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const formData = {
      comment: newComment,
      questionId: question._id,
    };

    try {
      const response = await postComment("POST", POST_COMMENT, formData, () => {
        setRefreshKey((prev) => prev + 1);
      });
      toast.success(response.message || "Answer posted successfully");
      setNewComment("");
      setShowCommentBox(false);
    } catch (error) {
      toast.error(error.message || "Unable to post answer");
    }
  };

  const handleUpdateQuestion = async () => {
    const updatedData = {
      questionTitle: updatedQuestion,
      tags: updatedTags.split(",").map((tag) => tag.trim()),
    };

   try {
    const response = await editQuestion("PATCH", `${EDIT_QUESTION}/${question._id}`, updatedData);
    toast.success(response.message || "Question updated successfully");
    question.questionTitle = updatedQuestion;
    question.tags = updatedData.tags;
    setEditMode(false);
   } catch (error) {
    toast.error(error.message || "Unable to update question");
   }
  };
  
  if (!question) return null;
  
  const authorName = question.author?.email?.split('@')[0] || "Unknown";
  const timeAgo = question.createdAt ? formatDistanceToNow(new Date(question.createdAt), { addSuffix: true }) : "";
  const isAuthor = userId && (question.author?._id || question.author) && userId === (question.author?._id || question.author);

  return (
    <div className="min-h-screen bg-bg-primary pt-6 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Question Card */}
        <div className="glass-card p-8 animate-fade-in relative overflow-hidden">
            {/* Gradient Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-blue to-accent-pink"></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-purple to-accent-pink flex items-center justify-center text-white font-bold text-lg">
                        {authorName[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="text-text-primary font-medium">{authorName}</div>
                        <div className="text-text-muted text-xs flex items-center gap-1">
                            <FiClock /> {timeAgo}
                        </div>
                    </div>
                 </div>
                 
                <div className="flex items-center gap-4 text-text-muted text-sm">
                    <span className="flex items-center gap-1.5"><FiEye className="text-primary-blue"/> {views} views</span>
                    <span className="flex items-center gap-1.5"><FiMessageSquare className="text-accent-pink"/> {comments?.length || 0} comments</span>
                </div>
            </div>

             {/* Content */}
             {editMode ? (
                 <div className="space-y-4">
                     <textarea
                        className="input-field min-h-[200px]"
                        value={updatedQuestion}
                        onChange={(e) => setUpdatedQuestion(e.target.value)}
                        placeholder="Type your question (Markdown supported)..."
                     />
                     <input
                        type="text"
                        className="input-field"
                        value={updatedTags}
                        onChange={(e) => setUpdatedTags(e.target.value)}
                        placeholder="Tags (comma separated)"
                     />
                     <div className="flex justify-end gap-2">
                        <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded-lg text-text-secondary hover:bg-white/5">Cancel</button>
                        <button onClick={handleUpdateQuestion} className="btn-primary flex items-center gap-2"><FiCheck /> Save Changes</button>
                     </div>
                 </div>
             ) : (
                 <div className="prose prose-invert max-w-none mb-8">
                    <ReactMarkdown
                        components={{
                        code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                            ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                            )
                        }
                        }}
                    >
                        {question.questionTitle}
                    </ReactMarkdown>
                 </div>
             )}

            {/* Footer */}
            {!editMode && (
                <div className="border-t border-white/5 pt-6 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        {question.tags?.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-primary-purple/10 text-primary-purple text-xs font-medium border border-primary-purple/20">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {isAuthor && (
                            <>
                                <button onClick={() => setEditMode(true)} className="p-2 text-text-muted hover:text-primary-blue transition-colors" title="Edit">
                                    <FiEdit2 />
                                </button>
                                <button onClick={async () => {
                                  try {
                                    const response = await deleteQuestion("DELETE", DELETE_QUESTION, { questionId: question._id }, () => navigate("/"));
                                    toast.success(response.message || "Question deleted successfully");
                                  } catch (error) {
                                    toast.error(error.message || "Unable to delete question");
                                  }
                                }} className="p-2 text-text-muted hover:text-red-500 transition-colors" title="Delete">
                                    <FiTrash2 />
                                </button>
                            </>
                        )}
                         <button className="p-2 text-text-muted hover:text-white transition-colors" title="Share">
                            <FiShare2 />
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Comments Section */}
        <div className="glass-card p-8 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">
                    {comments?.length} Answers
                </h2>
                <button onClick={() => setShowCommentBox(!showCommentBox)} className="text-sm font-medium text-primary-purple hover:underline">
                    {showCommentBox ? "Cancel" : "Add Answer"}
                </button>
            </div>
            
            {showCommentBox && (
                <div className="mb-8 bg-bg-secondary p-4 rounded-xl border border-white/5">
                     <textarea
                        className="input-field min-h-[100px] mb-3"
                        placeholder="Write your answer..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button onClick={handleAddComment} className="btn-primary flex items-center gap-2">
                            <FiSend /> Post Answer
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment._id} className="p-4 rounded-xl bg-bg-secondary/50 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="prose prose-invert prose-sm max-w-none text-text-secondary">
                                <ReactMarkdown>{comment.comment}</ReactMarkdown>
                            </div>
                            <div className="mt-2 text-xs text-text-muted flex justify-end">
                                {/* If we had author/time for comments, show here */}
                                Posted recently
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-text-muted py-8">
                        No answers yet. Be the first to help!
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default QuestionPage;
