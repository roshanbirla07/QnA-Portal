import React, { useEffect, useMemo, useState } from "react";
import { postQuestion } from "../../../services/qna.api";
import { POST_QUESTION, VECTOR_SEARCH_ROUTER } from "../../../services/apis";
import { useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiCheck, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiConnector";

const MAX_QUESTION_LENGTH = 220;
const MAX_TAGS = 10;

const QuestionForm = ({ setNewPostPopup, newPostPopup }) => {
  const [question, setQuestion] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const navigate = useNavigate();
  const [similar, setSimilar] = useState([]);
  const [checking, setChecking] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");

  const parsedTags = useMemo(() => [...new Set(
    tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean)
  )].slice(0, MAX_TAGS), [tags]);

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

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [question]);

  const close = () => {
    if (setNewPostPopup) setNewPostPopup(false);
    else navigate("/");
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length < 12) {
      setFieldError("Write a little more detail so others can understand the problem.");
      return;
    }

    if (!parsedTags.length) {
      setFieldError("Add at least one topic tag.");
      return;
    }

    setFieldError("");
    setSubmitting(true);

    try {
      const response = await postQuestion("POST", POST_QUESTION, {
        questionTitle: trimmedQuestion,
        tags: parsedTags,
      }, navigate);

      toast.success(response.message || "Question submitted");
      close();
    } catch (error) {
      toast.error(error.message || "Unable to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  const isPopup = newPostPopup !== undefined;
  const isVisible = newPostPopup || !isPopup;
  const questionCount = question.length;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={isPopup ? "question-composer-overlay" : "question-composer-page"}>
          {isPopup && (
            <motion.button
              type="button"
              aria-label="Close question form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="question-composer-backdrop"
              onClick={close}
            />
          )}

          <motion.section
            initial={{ opacity: 0, y: 14, scale: isPopup ? 0.985 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: isPopup ? 0.985 : 1 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
            className="question-composer"
            aria-labelledby="question-composer-title"
          >
            <header className="question-composer-header">
              <div>
                <p className="question-composer-eyebrow">COMMUNITY QUESTION</p>
                <h1 id="question-composer-title">Ask a clear, useful question</h1>
                <p>Give enough context for another developer to understand the problem quickly.</p>
              </div>
              <button type="button" className="icon-button" onClick={close} aria-label="Close question form">
                <FiX aria-hidden="true" />
              </button>
            </header>

            <form className="question-composer-form" noValidate onSubmit={submitHandler}>
              <div className="question-field">
                <div className="question-field-heading">
                  <label htmlFor="question-title">Question</label>
                  <span>{questionCount}/{MAX_QUESTION_LENGTH}</span>
                </div>
                <p className="question-field-help">Be specific. Include the language, framework, error, or behavior you are trying to understand.</p>
                <textarea
                  id="question-title"
                  className="input-field question-composer-textarea"
                  placeholder="Example: Why does my Kafka consumer rebalance whenever I deploy a new Node.js worker?"
                  rows="7"
                  minLength="12"
                  maxLength={MAX_QUESTION_LENGTH}
                  aria-describedby="question-help"
                  aria-invalid={Boolean(fieldError && question.trim().length < 12)}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                    if (fieldError) setFieldError("");
                  }}
                  value={question}
                />
                <span id="question-help" className="sr-only">Markdown is supported.</span>
              </div>

              <div className="question-field">
                <label htmlFor="question-tags">Topics</label>
                <p className="question-field-help">Add up to {MAX_TAGS} comma-separated topics so the right people can find it.</p>
                <input
                  id="question-tags"
                  type="text"
                  className="input-field"
                  placeholder="nodejs, kafka, postgresql"
                  aria-invalid={Boolean(fieldError && !parsedTags.length)}
                  onChange={(event) => {
                    setTags(event.target.value);
                    if (fieldError) setFieldError("");
                  }}
                  value={tags}
                />
                {parsedTags.length > 0 && (
                  <div className="question-tag-preview" aria-label="Selected topics">
                    {parsedTags.map((tag) => <span className="topic-chip" key={tag}>#{tag}</span>)}
                  </div>
                )}
              </div>

              {fieldError && <p className="question-form-error" role="alert">{fieldError}</p>}

              {question.trim().length >= 12 && (
                <section className="question-similar" aria-live="polite">
                  <div className="question-similar-heading">
                    <div>
                      <h2>Check for an existing answer</h2>
                      <p>A quick duplicate check can save time for you and the community.</p>
                    </div>
                    {checking && <span className="question-checking">Checking…</span>}
                  </div>

                  {!checking && suggestionError && <p className="question-similar-status">{suggestionError}</p>}
                  {!checking && !suggestionError && similar.length === 0 && (
                    <p className="question-similar-status"><FiCheck aria-hidden="true" /> No close matches found.</p>
                  )}
                  {!checking && similar.length > 0 && (
                    <ul>
                      {similar.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          <a href={`/posts/${encodeURIComponent(item.slug)}`} target="_blank" rel="noopener noreferrer">
                            <span>{item.title}</span>
                            <FiArrowUpRight aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              <footer className="question-composer-actions">
                <p>Your question will be submitted for review before it appears publicly.</p>
                <div>
                  <button type="button" className="glass-button" onClick={close} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Posting…" : "Post question"}
                    {!submitting && <FiArrowUpRight aria-hidden="true" />}
                  </button>
                </div>
              </footer>
            </form>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuestionForm;
