import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import toast from "react-hot-toast";
import { FiArrowLeft, FiBookmark, FiMessageSquare, FiThumbsDown, FiThumbsUp } from "react-icons/fi";
import { publishingApi } from "../../../services/publishing.api";
import "./publishing.css";

const MarkdownBody = ({ value }) => (
  <div className="prose-content">
    <ReactMarkdown
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <SyntaxHighlighter language={match[1]} PreTag="div">{String(children).replace(/\n$/, "")}</SyntaxHighlighter>
          ) : <code className={className} {...props}>{children}</code>;
        },
      }}
    >{value}</ReactMarkdown>
  </div>
);

const PostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    publishingApi.getPost(slug)
      .then(async (res) => {
        if (!active) return;
        const loaded = res.data?.data;
        setPost(loaded);
        publishingApi.recordView(slug).catch(() => {});
        if (loaded?.type === "question") {
          const answerRes = await publishingApi.getAnswers(loaded._id);
          if (active) setAnswers(answerRes.data?.data || []);
        }
      })
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [slug]);

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    try {
      const res = await publishingApi.addAnswer(post._id, { content: { format: "markdown", value: answer }, contentText: answer });
      setAnswers((items) => [...items, res.data?.data]);
      setAnswer("");
      toast.success("Answer posted");
    } catch (err) { toast.error(err.message); }
  };

  const vote = async (value) => {
    try {
      const res = await publishingApi.vote({ targetId: post._id, targetType: "post", value });
      const nextScore = res.data?.data?.score;
      if (typeof nextScore === "number") setPost((p) => ({ ...p, score: nextScore }));
    } catch (err) { toast.error(err.message); }
  };

  const bookmark = async () => {
    try { await publishingApi.bookmark(post._id); toast.success("Saved to bookmarks"); }
    catch (err) { toast.error(err.message); }
  };

  if (error) return <main className="reader-shell"><p className="feed-state error">{error}</p></main>;
  if (!post) return <main className="reader-shell"><p className="feed-state">Loading…</p></main>;

  const markdown = post.content?.value || post.contentText || "";
  return (
    <main className="reader-shell">
      <Link to="/" className="reader-back"><FiArrowLeft /> Back to feed</Link>
      <article className="reader-post">
        <span className={`type-pill type-pill--${post.type}`}>{post.type}</span>
        <h1>{post.title}</h1>
        {post.subtitle && <p className="reader-subtitle">{post.subtitle}</p>}
        <div className="reader-author">{post.author?.displayName || post.author?.username || post.author?.email} · {post.readingTime || 1} min read · {post.views || 0} views</div>
        <div className="publish-card__tags">{(post.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}</div>
        <div className="reader-actions">
          <button onClick={() => vote(1)}><FiThumbsUp /> {post.score || 0}</button>
          <button onClick={() => vote(-1)}><FiThumbsDown /></button>
          <button onClick={bookmark}><FiBookmark /> Save</button>
        </div>
        <MarkdownBody value={markdown} />
      </article>

      {post.type === "question" && (
        <section className="answers-section">
          <h2><FiMessageSquare /> {answers.length} Answers</h2>
          <div className="answer-compose">
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write an answer using Markdown…" />
            <button onClick={submitAnswer}>Post answer</button>
          </div>
          {answers.map((item) => (
            <article className={`answer-card ${item.accepted ? "accepted" : ""}`} key={item._id}>
              {item.accepted && <strong>Accepted answer</strong>}
              <MarkdownBody value={item.content?.value || item.contentText || ""} />
              <small>{item.author?.displayName || item.author?.username || item.author?.email}</small>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default PostDetail;
