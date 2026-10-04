import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { VECTOR_SEARCH_ROUTER } from "../../../services/apis";

const SemanticSearchPage = () => {
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const search = async (event) => {
    event.preventDefault();
    setLoading(true); setError("");
    try { const result = await apiConnector("POST", VECTOR_SEARCH_ROUTER, { text }); setItems(result.data.data); }
    catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  };
  return <main className="max-w-4xl mx-auto px-4 py-10 text-text-primary space-y-6">
    <header><h1 className="text-3xl font-bold">Semantic search</h1>
      <p className="text-text-secondary mt-2">Describe a topic or problem in your own words to find related public questions and articles.</p></header>
    <form onSubmit={search} className="space-y-3"><textarea required minLength={8} maxLength={2000} rows={4}
      aria-label="Describe what you are looking for" className="input-field w-full" value={text} onChange={(event) => setText(event.target.value)} />
      <button disabled={loading} className="btn-primary" type="submit">{loading ? "Searching…" : "Find related content"}</button>
    </form>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    {items.length ? <div className="space-y-3">{items.map((item) => <article key={item.postId} className="rounded-xl border border-white/10 bg-bg-secondary p-5">
      <p className="text-sm text-text-muted capitalize">{item.type}</p>
      <Link to={`/posts/${item.slug}`} className="text-xl font-semibold text-primary-blue hover:underline">{item.title}</Link>
      <p className="text-text-secondary mt-2">{item.excerpt}</p>
    </article>)}</div> : !loading && !error && <p className="text-text-secondary">No related content found yet.</p>}
  </main>;
};

export default SemanticSearchPage;
