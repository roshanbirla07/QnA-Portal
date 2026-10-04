import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { JOBS_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";

const kinds = [
  ["saved", "Saved"], ["applied", "Applied"], ["still_open", "Still Open"],
  ["got_interview", "Got Interview"], ["closed", "Closed"], ["incorrect", "Incorrect"],
];

const JobCommunity = ({ jobId }) => {
  const [data, setData] = useState({ comments: [], signals: {}, hasMore: false });
  const [mine, setMine] = useState([]);
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const root = `${JOBS_ROUTER}/${jobId}`;

  useEffect(() => {
    let active = true;
    setError("");
    apiConnector("GET", `${root}/community`, null, null, { page })
      .then((response) => { if (active) setData(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); });
    if (token) apiConnector("GET", `${root}/signals/me`)
      .then((response) => { if (active) setMine(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [root, token, page, reload]);

  const toggle = async (kind) => {
    try {
      await apiConnector(mine.includes(kind) ? "DELETE" : "PUT", `${root}/signals/${kind}`);
      setReload((value) => value + 1);
    } catch (reason) { toast.error(reason.message); }
  };

  const send = async (event) => {
    event.preventDefault();
    try {
      await apiConnector("POST", `${root}/comments`, { text });
      setText("");
      setPage(1);
      setReload((value) => value + 1);
    } catch (reason) { toast.error(reason.message); }
  };

  return <section className="mt-8 space-y-6">
    <h2 className="text-2xl font-semibold">Community activity</h2>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    <div className="flex flex-wrap gap-2">
      {kinds.map(([kind, label]) => <button key={kind} type="button" disabled={!token}
        title={token ? label : "Sign in to add a signal"}
        aria-pressed={mine.includes(kind)}
        onClick={() => toggle(kind)}
        className={`rounded-full px-3 py-2 border border-white/10 disabled:opacity-60 ${mine.includes(kind) ? "bg-primary-purple/20 text-primary-purple" : "text-text-secondary"}`}>
        {label} · {data.signals[kind] || 0}
      </button>)}
    </div>
    <p className="text-sm text-text-muted">Community signals are reports, not confirmed job status.</p>
    <h3 className="text-xl font-semibold">Discussion ({data.total || 0})</h3>
    {token ? <form onSubmit={send} className="space-y-3">
      <textarea aria-label="Write a comment" required maxLength={2000} value={text} rows={3}
        onChange={(event) => setText(event.target.value)} className="input-field w-full" />
      <button type="submit" className="btn-primary">Post comment</button>
    </form> : <p><Link to="/login" className="text-primary-blue underline">Sign in</Link> to join the discussion.</p>}
    {data.comments.length ? <div className="space-y-3">
      {data.comments.map((item) => <article key={item._id} className="bg-bg-secondary border border-white/10 rounded-xl p-4">
        <p className="text-sm text-text-secondary">{item.authorId?.displayName || item.authorId?.username || "Member"} · {new Date(item.createdAt).toLocaleDateString()}</p>
        <p className="whitespace-pre-wrap mt-2">{item.text}</p>
      </article>)}
      <nav aria-label="Discussion pages" className="flex gap-4 justify-center">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page}</span>
        <button disabled={!data.hasMore} onClick={() => setPage(page + 1)}>Next</button>
      </nav>
    </div> : <p className="text-text-secondary">No comments yet.</p>}
  </section>;
};

export default JobCommunity;
