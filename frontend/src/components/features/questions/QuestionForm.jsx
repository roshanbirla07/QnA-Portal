import React, { useEffect, useState } from "react";
import { postQuestion } from "../../../services/qna.api";
import { POST_QUESTION, VECTOR_SEARCH_ROUTER } from "../../../services/apis";
import { useNavigate } from "react-router-dom";
import { FiX, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiConnector";

const QuestionForm = ({ setNewPostPopup, newPostPopup }) => {
  const [question, setQuestion] = useState("");
  const [tags, setTags] = useState("");
  const navigate = useNavigate();
  const [similar, setSimilar] = useState([]);
  const [checking, setChecking] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");

  useEffect(() => {
    const title = question.trim();
    if (title.length < 12) {
      setSimilar([]);
      setSuggestionError("");
      setChecking(false);
      return;
    }
    let active = true;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const response = await apiConnector("POST", `${VECTOR_SEARCH_ROUTER}/duplicates`, { title });
        if (active) {
          setSimilar(response.data.data || []);
          setSuggestionError("");
        }
      } catch (error) {
        if (active) {
          setSimilar([]);
          setSuggestionError("Similar questions are unavailable right now.");
        }
      } finally {
        if (active) setChecking(false);
      }
    }, 550);
    return () => { active = false; clearTimeout(timer); };
  }, [question]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!question.trim() || !tags.trim()) return;

    const arrTags = tags.split(",").map((tag) => tag.trim());

    const formData = {
      questionTitle: question,
      tags: arrTags,
    };

    try {
      const response = await postQuestion("POST", POST_QUESTION, formData, navigate);
      toast.success(response.message || "Question submitted");
      if (setNewPostPopup) {
        setNewPostPopup(false);
      }
    } catch (error) {
      toast.error(error.message || "Unable to submit question");
    }
  };

  return (
    <AnimatePresence>
      {(newPostPopup || newPostPopup === undefined) && (
        <div className={`${newPostPopup === undefined ? "min-h-screen bg-bg-primary pt-24" : "fixed inset-0 min-h-screen"} flex items-center justify-center z-50 px-4`}>
             {/* Backdrop */}
             {newPostPopup !== undefined && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setNewPostPopup(false)}
                />
             )}

             {/* Modal */}
             <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
             >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-purple to-primary-blue p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">Ask a Question</h2>
                    <button onClick={() => setNewPostPopup ? setNewPostPopup(false) : navigate("/")} className="text-white/80 hover:text-white transition-colors">
                        <FiX className="text-xl" />
                    </button>
                </div>

                <div className="p-6">
                    <form className="space-y-6" onSubmit={submitHandler}>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Your Question (Markdown supported)
                            </label>
                            <textarea
                                className="input-field min-h-[150px] resize-y"
                                placeholder="Describe your question in detail..."
                                rows="6"
                                onChange={(e) => setQuestion(e.target.value)}
                                value={question}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Tags</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="javascript, react, backend (comma separated)"
                                onChange={(e) => setTags(e.target.value)}
                                value={tags}
                            />
                        </div>

                        {question.trim().length >= 12 && (
                          <div className="rounded-xl border border-border bg-bg-primary p-4" aria-live="polite">
                            <h3 className="font-semibold text-text-primary">Similar questions</h3>
                            {checking && <p className="text-sm text-text-secondary">Checking existing questions…</p>}
                            {!checking && suggestionError && <p className="text-sm text-text-secondary">{suggestionError}</p>}
                            {!checking && !suggestionError && similar.length === 0 && <p className="text-sm text-text-secondary">No close matches found.</p>}
                            {!checking && similar.length > 0 && (
                              <ul className="mt-2 space-y-2">
                                {similar.map((item) => (
                                  <li key={item.id}>
                                    <a className="text-primary-blue hover:underline" href={`/posts/${encodeURIComponent(item.slug)}`} target="_blank" rel="noopener noreferrer">{item.title}</a>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <p className="mt-2 text-xs text-text-secondary">You can still submit your question.</p>
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                             <button
                                type="button"
                                className="px-4 py-2 rounded-lg text-text-secondary hover:bg-white/5 transition-colors"
                                onClick={() => setNewPostPopup ? setNewPostPopup(false) : navigate("/")}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary flex items-center gap-2"
                            >
                                <FiCheck /> Submit Question
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuestionForm;
