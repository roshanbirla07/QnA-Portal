import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { JOBS_ROUTER, TOPICS_ROUTER, RANKINGS_ROUTER } from "../../../services/apis";
import config from "../../../config/variables";
import { useAuth } from "../../../contexts/AuthContext";
import "./Home.css";
const feedUrl = `${config.apiBaseUrl.replace(/\/$/, "")}/api/v1/feed`;
const tabs = ["For You", "Questions", "Articles", "Jobs", "Trending"];
const Home = () => {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : "For You";
  const [data, setData] = useState({ items: [], nextCursor: null });
  const [side, setSide] = useState({ topics: [], people: [], jobs: [], discussions: [] });
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [cursor, setCursor] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const options = { limit: 15, ...(cursor ? { cursor } : {}), ...(tab === "Questions" ? { type: "question" } : tab === "Articles" ? { type: "article" } : {}), ...(tab === "Trending" ? { sort: "trending" } : {}) };
    const load = async () => {
      if (tab === "Jobs") {
        const response = await apiConnector("GET", JOBS_ROUTER);
        return { items: response.data.data.items.map((job) => ({ ...job, type: "job" })), nextCursor: null };
      }
      const following = tab === "For You" && token;
      let response = await apiConnector("GET", following ? `${feedUrl}/following` : feedUrl, null, null, options);
      if (following && !response.data.data.items.length && !cursor) response = await apiConnector("GET", feedUrl, null, null, options);
      return response.data.data;
    };
    load().then((result) => { if (active) setData((old) => ({ ...result, items: cursor ? [...old.items, ...result.items] : result.items })); })
      .catch((reason) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, token, cursor]);
  useEffect(() => {
    let active = true;
    Promise.allSettled([apiConnector("GET", TOPICS_ROUTER, null, null, { limit: 6 }), apiConnector("GET", RANKINGS_ROUTER), apiConnector("GET", JOBS_ROUTER, null, null, { limit: 3 }), apiConnector("GET", feedUrl, null, null, { sort: "trending", type: "question", limit: 3 })]).then(([topics, people, jobs, discussions]) => {
      if (active) setSide({ topics: topics.status === "fulfilled" ? topics.value.data.data : [], people: people.status === "fulfilled" ? people.value.data.data.allTime.slice(0, 3) : [], jobs: jobs.status === "fulfilled" ? jobs.value.data.data.items : [], discussions: discussions.status === "fulfilled" ? discussions.value.data.data.items : [] });
    });
    return () => { active = false; };
  }, []);
  return <main className="feed-page">
    <header className="feed-heading"><div><p className="feed-eyebrow">KNOWLEDGE + CAREER</p><h1>Your developer community</h1><p>Learn something useful. Share what you know. Find your next opportunity.</p></div><Link to="/submitquestion" className="btn-primary">Ask a question</Link></header>
    <form className="feed-search" action="/search"><label htmlFor="feed-search" className="sr-only">Search the community</label><input id="feed-search" className="input-field" name="q" placeholder="Search questions, articles, and jobs" /><button className="glass-button">Search</button></form>
    <div className="feed-columns"><section aria-label="Community feed">
      <nav className="feed-tabs" aria-label="Feed filters">{tabs.map((name) => <button key={name} aria-current={tab === name ? "page" : undefined} onClick={() => { setCursor(""); setParams({ tab: name }); }}>{name}</button>)}</nav>
      {tab === "For You" && <p className="feed-note">{token ? "Posts from people you follow, plus community discoveries when your feed is empty." : "Community discoveries. Sign in to personalize your feed."}</p>}
      {error && <p role="alert" className="surface-card p-5">{error}</p>}
      {loading && !cursor && <p role="status" className="surface-card p-5">Loading the feed…</p>}
      {!loading && !error && !data.items.length && <div className="surface-card p-8"><h2>No posts yet</h2><p>Start a discussion or explore another tab.</p></div>}
      {!error && (!loading || cursor) && <div className="feed-list">{data.items.map((post) => <article className="feed-card" key={post._id}>
        <div className="feed-card-meta"><span>{post.type === "job" ? post.company : post.author?.displayName || post.author?.username || "Community member"}</span><span>{post.type} · {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</span></div>
        <h2><Link to={post.type === "job" ? `/jobs/${post._id}` : `/posts/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt || post.description || String(post.contentText || "").slice(0, 220)}</p>
        <div className="feed-tags">{post.tags?.map((tag) => <Link className="topic-chip" to={`/topics/${tag}`} key={tag}>{tag}</Link>)}</div>
        <footer>{post.type === "job" ? post.location || "Location not provided" : `${post.score || 0} votes · ${post.answerCount || 0} answers · ${post.views || 0} views`}<Link to={post.type === "job" ? `/jobs/${post._id}` : `/posts/${post.slug}`}>{post.type === "job" ? "View role →" : "Join the discussion →"}</Link></footer>
      </article>)}</div>}
      {data.nextCursor && <button className="glass-button mt-5" disabled={loading} onClick={() => setCursor(data.nextCursor)}>{loading ? "Loading…" : "Load more"}</button>}
    </section><aside className="feed-sidebar">
      <section className="surface-card p-5"><h2>Trending topics</h2><div className="feed-tags">{side.topics.map((topic) => <Link className="topic-chip" key={topic.slug} to={`/topics/${topic.slug}`}>{topic.name}</Link>)}</div>{!side.topics.length && <p>No topics yet.</p>}</section>
      <section className="surface-card p-5"><h2>Top contributors</h2>{side.people.map((person) => <p key={person.userId}><strong>{person.displayName || person.username || "Member"}</strong><br /><span>{person.points} reputation points</span></p>)}<Link to="/rankings">See the leaderboard →</Link></section>
      <section className="surface-card p-5"><h2>Career opportunities</h2>{side.jobs.map((job) => <p key={job._id}><Link to={`/jobs/${job._id}`}>{job.title}</Link><br /><span>{job.company}</span></p>)}<Link to="/jobs">Explore jobs →</Link></section>
      <section className="surface-card p-5"><h2>Active discussions</h2>{side.discussions.map((post) => <p key={post._id}><Link to={`/posts/${post.slug}`}>{post.title}</Link><br /><span>{post.answerCount || 0} answers</span></p>)}</section>
    </aside></div>
  </main>;
};
export default Home;
