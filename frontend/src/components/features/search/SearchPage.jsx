import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { SEARCH_ROUTER } from "../../../services/apis";

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({ q: params.get("q") || "", kind: params.get("kind") || "", tag: params.get("tag") || "", company: params.get("company") || "" });
  const [data, setData] = useState({ items: [], total: 0, hasMore: false });
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const page = Math.max(Number.parseInt(params.get("page"), 10) || 1, 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiConnector("GET", SEARCH_ROUTER, null, null, Object.fromEntries(params.entries()))
      .then((response) => { if (active) { setData(response.data.data); setError(""); } })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.toString()]);

  useEffect(() => {
    if (form.q.trim().length < 2) { setSuggestions([]); return undefined; }
    let active = true;
    const timer = setTimeout(() => {
      apiConnector("GET", SEARCH_ROUTER, null, null, { q: form.q.trim(), autocomplete: "true" })
        .then((response) => { if (active) setSuggestions(response.data.data.items); })
        .catch(() => { if (active) setSuggestions([]); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [form.q]);

  const href = (item) => item.kind === "job" ? `/jobs/${item.id}` : `/posts/${item.slug}`;
  const updatePage = (next) => setParams({ ...Object.fromEntries(params.entries()), page: String(next) });
  return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary space-y-6">
    <header><h1 className="text-3xl font-bold">Search</h1><p className="text-text-secondary mt-2">Explore public questions, articles and community jobs.</p></header>
    <Link to="/semantic-search" className="text-primary-blue">Explore semantic search →</Link>
    <form onSubmit={(event) => { event.preventDefault(); setParams(Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim()))); }}
      className="grid gap-3 md:grid-cols-5">
      <input aria-label="Search keywords" value={form.q} maxLength={120} onChange={(event) => setForm({ ...form, q: event.target.value })} className="input-field md:col-span-2" placeholder="Search keywords" />
      <select aria-label="Content type" value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })} className="input-field">
        <option value="">All content</option><option value="question">Questions</option><option value="article">Articles</option><option value="job">Jobs</option>
      </select>
      <input aria-label="Topic tag" value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} className="input-field" placeholder="Topic tag" />
      <button className="btn-primary" type="submit">Search</button>
      <input aria-label="Company filter" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} className="input-field md:col-span-2" placeholder="Company (jobs)" />
    </form>
    {!!suggestions.length && <div className="rounded-xl border border-white/10 bg-bg-secondary p-4"><p className="text-sm text-text-muted mb-2">Title suggestions</p>
      {suggestions.map((item) => <Link key={`${item.kind}-${item.id}`} to={href(item)} className="block text-primary-blue hover:underline py-1">{item.title}</Link>)}</div>}
    {loading ? <p>Searching…</p> : error ? <p role="alert" className="text-red-400">{error}</p> : <>
      <p className="text-text-secondary">{data.total} results</p>
      <div className="space-y-3">{data.items.map((item) => <article key={`${item.kind}-${item.id}`} className="rounded-xl border border-white/10 bg-bg-secondary p-5">
        <p className="text-sm text-text-muted">{item.kind}{item.company ? ` · ${item.company}` : ""}</p>
        <Link to={href(item)} className="text-xl font-semibold text-primary-blue hover:underline">{item.title}</Link>
        <p className="text-text-secondary mt-2 line-clamp-3">{item.description}</p>
        {!!item.tags?.length && <p className="text-sm text-text-muted mt-2">{item.tags.join(" · ")}</p>}
      </article>)}</div>
      {!data.items.length && <p>No matches found.</p>}
      <nav aria-label="Search results pages" className="flex gap-4"><button disabled={page <= 1} onClick={() => updatePage(page - 1)}>Previous</button>
        <span>Page {page}</span><button disabled={!data.hasMore} onClick={() => updatePage(page + 1)}>Next</button></nav>
    </>}
  </main>;
};

export default SearchPage;
