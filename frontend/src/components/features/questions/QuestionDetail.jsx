import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { apiConnector } from "../../../services/apiConnector";
import { POSTS_ROUTER, FETCH_COMMENTS, POST_COMMENT } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";
import { decodeToken } from "../../../utils/auth";
import toast from "react-hot-toast";
import "./QuestionDetail.css";
const root = POSTS_ROUTER.replace(/\/posts$/, "");
const VoteRail = ({ id, type, score }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(score || 0), [vote, setVote] = useState(0), [busy, setBusy] = useState(false);
  useEffect(() => { setCount(score || 0); setVote(0); }, [score, id]);
  const cast = async (value) => {
    if (!token) { navigate("/login"); return; }
    setBusy(true);
    try {
      const response = await apiConnector("POST", `${root}/interactions/votes`, { targetType: type, targetId: id, value: vote === value ? 0 : value });
      setCount(response.data.data.score); setVote(response.data.data.userVote);
    } catch (reason) { toast.error(reason.message); } finally { setBusy(false); }
  };
  return <div className="qa-vote" aria-label="Votes"><button aria-label="Upvote" aria-pressed={vote === 1} disabled={busy} onClick={() => cast(1)}>▲</button><strong>{count}</strong><button aria-label="Downvote" aria-pressed={vote === -1} disabled={busy} onClick={() => cast(-1)}>▼</button></div>;
};
const QuestionDetail = ({ post: initialPost }) => {
  const { token } = useAuth();
  const viewer = decodeToken(token), navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [answers, setAnswers] = useState([]), [comments, setComments] = useState([]), [related, setRelated] = useState([]);
  const [sort, setSort] = useState("best"), [answer, setAnswer] = useState(""), [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [reload, setReload] = useState(0);
  const [saved, setSaved] = useState(false), [following, setFollowing] = useState(false), [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: initialPost.title || initialPost.questionTitle, content: initialPost.contentText || initialPost.questionTitle, tags: initialPost.tags?.join(", ") || "" });
  const id = initialPost._id, tag = initialPost.tags?.[0] || "";
  const authorId = String(post.author?._id || post.author || "");
  const owner = viewer.userId === authorId || viewer.roleType === "admin";
  useEffect(() => { setPost(initialPost); }, [initialPost]);
  useEffect(() => {
    let active = true;
    if (initialPost.slug && initialPost.status !== "draft") apiConnector("POST", `${POSTS_ROUTER}/${initialPost.slug}/view`).then((response) => { if (active) setPost((old) => ({ ...old, views: response.data.data.views })); }).catch(() => {});
    return () => { active = false; };
  }, [id, initialPost.slug, initialPost.status]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    Promise.allSettled([
      apiConnector("GET", `${root}/questions/${id}/answers`),
      apiConnector("GET", `${FETCH_COMMENTS}/${id}`),
      tag ? apiConnector("GET", `${root}/feed`, null, null, { tag, type: "question", limit: 5 }) : Promise.resolve(null),
    ]).then(([answerResult, commentResult, relatedResult]) => {
      if (!active) return;
      if (answerResult.status === "fulfilled") setAnswers(answerResult.value.data.data);
      else setError(answerResult.reason.message);
      setComments(commentResult.status === "fulfilled" ? commentResult.value.data.data : []);
      setRelated(relatedResult.status === "fulfilled" && relatedResult.value ? relatedResult.value.data.data.items.filter((item) => item._id !== id) : []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [id, tag, reload, initialPost]);
  useEffect(() => {
    let active = true;
    if (token) apiConnector("GET", `${root}/interactions/bookmarks`).then((response) => { if (active) setSaved(response.data.data.some((item) => item._id === id)); }).catch(() => {});
    return () => { active = false; };
  }, [token, id]);
  const act = async (action) => {
    if (!token) { navigate("/login"); return; }
    setBusy(true);
    try { await action(); } catch (reason) { toast.error(reason.message); } finally { setBusy(false); }
  };
  const ordered = [...answers].sort((a, b) => Number(b.accepted) - Number(a.accepted) || (sort === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : (b.score || 0) - (a.score || 0)));
  const author = post.author?.displayName || post.author?.username || "Community member";
  return <main className="qa-page">
    <nav aria-label="Breadcrumb" className="qa-breadcrumb"><Link to="/">Community</Link> / <span>Question</span></nav>
    <header className="qa-heading"><h1>{post.title || post.questionTitle}</h1><p>Asked {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""} · {post.views || 0} views · {answers.length} answers</p></header>
    <div className="qa-columns"><div>
      <article className="qa-card"><VoteRail id={id} type="post" score={post.score} /><div className="qa-body">
        {editing ? <form className="qa-editor" onSubmit={(event) => { event.preventDefault(); act(async () => {
          const result = await apiConnector("PATCH", `${POSTS_ROUTER}/${id}`, { title: draft.title, content: draft.content, contentText: draft.content, tags: draft.tags.split(",").map((item) => item.trim()).filter(Boolean) });
          setPost(result.data.data); setEditing(false);
        }); }}><label>Title<input className="input-field" required maxLength={220} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Details<textarea className="input-field" rows={8} required value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></label><label>Topics<input className="input-field" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} /></label><div><button className="btn-primary" disabled={busy}>Save changes</button><button type="button" className="glass-button" onClick={() => setEditing(false)}>Cancel</button></div></form> : <div className="qa-markdown"><ReactMarkdown>{post.contentText || post.questionTitle || post.title}</ReactMarkdown></div>}
        <div className="qa-tags">{post.tags?.map((topic) => <Link className="topic-chip" key={topic} to={`/topics/${topic}`}>{topic}</Link>)}</div>
        <div className="qa-byline"><strong>{author}</strong>{typeof post.author?.reputation === "number" && <span>{post.author.reputation} reputation</span>}</div>
        <div className="qa-actions">
          <button disabled={busy} onClick={() => act(async () => { await apiConnector(saved ? "DELETE" : "POST", `${root}/interactions/bookmarks/${id}`); setSaved(!saved); })}>{saved ? "Saved" : "Save"}</button>
          <button onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.slug}`); toast.success("Link copied"); } catch { toast.error("Could not copy link"); } }}>Share</button>
          {authorId && viewer.userId !== authorId && <button disabled={busy} onClick={() => act(async () => { await apiConnector(following ? "DELETE" : "POST", `${root}/interactions/follows/${authorId}`); setFollowing(!following); })}>{following ? "Following author" : "Follow author"}</button>}
          {owner && <><button onClick={() => setEditing(true)}>Edit</button><button disabled={busy} onClick={() => { if (window.confirm("Delete this question?")) act(async () => { await apiConnector("DELETE", `${POSTS_ROUTER}/${id}`); navigate("/"); }); }}>Delete</button></>}
        </div>
      </div></article>
      <section className="qa-answers"><div className="qa-answer-heading"><h2>{answers.length} answers</h2><label>Sort <select className="input-field" value={sort} onChange={(e) => setSort(e.target.value)}><option value="best">Best answers</option><option value="newest">Newest first</option></select></label></div>
        {loading && <p role="status">Loading answers…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && !answers.length && <p className="qa-empty">Be the first to share a useful answer.</p>}
        {ordered.map((item) => <article className={`qa-card ${item.accepted ? "qa-accepted" : ""}`} key={item._id}><VoteRail id={item._id} type="answer" score={item.score} /><div className="qa-body">{item.accepted && <p className="qa-accepted-label">✓ Accepted answer</p>}<div className="qa-markdown"><ReactMarkdown>{item.contentText}</ReactMarkdown></div><div className="qa-byline"><strong>{item.authorId?.displayName || item.authorId?.username || "Member"}</strong>{typeof item.authorId?.reputation === "number" && <span>{item.authorId.reputation} reputation</span>}</div>{owner && !item.accepted && <button className="glass-button" disabled={busy} onClick={() => act(async () => { await apiConnector("POST", `${root}/questions/${id}/answers/${item._id}/accept`); setReload((value) => value + 1); })}>Accept answer</button>}</div></article>)}
        <form className="surface-card p-6 mt-5 qa-editor" onSubmit={(event) => { event.preventDefault(); act(async () => { await apiConnector("POST", `${root}/questions/${id}/answers`, { content: answer, contentText: answer }); setAnswer(""); setReload((value) => value + 1); }); }}><label htmlFor="qa-answer">Your answer</label><textarea id="qa-answer" required rows={7} maxLength={20000} className="input-field" placeholder="Explain your approach. Markdown is supported." value={answer} onChange={(e) => setAnswer(e.target.value)} /><button className="btn-primary" disabled={busy}>{token ? "Post answer" : "Sign in to answer"}</button></form>
      </section>
      <section className="surface-card p-6 mt-6"><h2 className="font-semibold">Comments</h2>{comments.map((item) => <p className="qa-comment" key={item._id}>{item.comment}<span>{item.authorId?.displayName || item.authorId?.username || "Member"}</span></p>)}<form className="qa-editor mt-4" onSubmit={(event) => { event.preventDefault(); act(async () => { await apiConnector("POST", POST_COMMENT, { questionId: id, comment }); setComment(""); setReload((value) => value + 1); }); }}><label htmlFor="qa-comment">Add a comment</label><textarea id="qa-comment" className="input-field" required maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} /><button className="glass-button" disabled={busy}>Add comment</button></form></section>
    </div><aside className="qa-sidebar"><section className="surface-card p-5"><h2>Related questions</h2>{related.length ? related.map((item) => <p key={item._id}><Link to={`/posts/${item.slug}`}>{item.title}</Link></p>) : <p>No related questions yet.</p>}</section><section className="surface-card p-5"><h2>Explore this topic</h2>{post.tags?.map((topic) => <p key={topic}><Link to={`/topics/${topic}`}>#{topic}</Link> · <Link to={`/experts?topic=${topic}`}>Find experts</Link></p>)}</section></aside></div>
  </main>;
};
export default QuestionDetail;

