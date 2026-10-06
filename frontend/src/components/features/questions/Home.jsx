import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { JOBS_ROUTER, TOPICS_ROUTER, RANKINGS_ROUTER } from "../../../services/apis";
import config from "../../../config/variables";
import { useAuth } from "../../../contexts/AuthContext";
import "./Home.css";
import { FiArrowUpRight, FiMessageCircle, FiEye, FiThumbsUp } from "react-icons/fi";
import SearchField from "../../common/SearchField";
import Avatar from "../../common/Avatar";
import PageState from "../../common/PageState";
const feedUrl = `${config.apiBaseUrl.replace(/\/$/, "")}/api/v1/feed`;
const tabs = ["For You", "Questions", "Articles", "Jobs", "Trending"];
const Home = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const feedSource = useRef("auto");
  const [params, setParams] = useSearchParams();
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : "For You";
  const [data, setData] = useState({ items: [], nextCursor: null });
  const [side, setSide] = useState({ topics: [], people: [], jobs: [], discussions: [] });
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [cursor, setCursor] = useState("");
  useEffect(() => { feedSource.current = "auto"; }, [token]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const options = { limit: 15, ...(cursor ? { cursor } : {}), ...(tab === "Questions" ? { type: "question" } : tab === "Articles" ? { type: "article" } : {}), ...(tab === "Trending" ? { sort: "trending" } : {}) };
    const load = async () => {
      if (tab === "Jobs") {
        const response = await apiConnector("GET", JOBS_ROUTER);
        return { items: response.data.data.items.map((job) => ({ ...job, type: "job" })), nextCursor: null };
      }
      const following = tab === "For You" && token && feedSource.current !== "public";
      let response = await apiConnector("GET", following ? `${feedUrl}/following` : feedUrl, null, null, options);
      if (following && !response.data.data.items.length && !cursor) {
        response = await apiConnector("GET", feedUrl, null, null, options);
        if (active) feedSource.current = "public";
      }
      return response.data.data;
    };
    load().then((result) => { if (active) setData((old) => ({ ...result, items: cursor ? [...new Map([...old.items, ...result.items].map((item) => [item._id, item])).values()] : result.items })); })
      .catch((reason) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, token, cursor, reload]);
  useEffect(() => {
    let active = true;
    Promise.allSettled([apiConnector("GET", TOPICS_ROUTER, null, null, { limit: 6 }), apiConnector("GET", RANKINGS_ROUTER), apiConnector("GET", JOBS_ROUTER, null, null, { limit: 3 }), apiConnector("GET", feedUrl, null, null, { sort: "trending", type: "question", limit: 3 })]).then(([topics, people, jobs, discussions]) => {
      if (active) setSide({ topics: topics.status === "fulfilled" ? topics.value.data.data : [], people: people.status === "fulfilled" ? people.value.data.data.allTime.slice(0, 3) : [], jobs: jobs.status === "fulfilled" ? jobs.value.data.data.items : [], discussions: discussions.status === "fulfilled" ? discussions.value.data.data.items : [] });
    });
    return () => { active = false; };
  }, []);
  return <main className="feed-page">
    <header className="feed-heading"><div><p className="feed-eyebrow">KNOWLEDGE + CAREER</p><h1>Good questions. Better together.</h1><p>A place for developers to exchange ideas, solve problems, and discover their next opportunity.</p></div><Link to="/submitquestion" className="btn-primary">Ask a question <FiArrowUpRight aria-hidden="true" /></Link></header>
    <form noValidate role="search" className="feed-search" onSubmit={(event) => { event.preventDefault(); navigate(search.trim() ? "/search?q=" + encodeURIComponent(search.trim()) : "/search"); }}>
      <SearchField id="feed-search" value={search} onChange={setSearch} label="Search the community" placeholder="What are you working on?" /><button type="submit" className="glass-button">Search</button>
    </form>
    <div className="feed-columns"><section className="feed-main" aria-label="Community feed" aria-busy={loading}>
      <nav className="feed-tabs" aria-label="Feed filters">{tabs.map((name) => <button type="button" key={name} aria-pressed={tab === name} onClick={() => { setCursor(""); feedSource.current = "auto"; setParams({ tab: name }); }}>{name}</button>)}</nav>
      {tab === "For You" && <p className="feed-note">{token ? "From people you follow, with fresh discoveries from the community." : "Discover what the community is sharing. Sign in for a personal feed."}</p>}
      {error && <PageState state="error" title="The feed couldn't load"><p>Check your connection and try again.</p><button type="button" className="glass-button mt-4" onClick={() => setReload((value) => value + 1)}>Try again</button></PageState>}
      {loading && !cursor && <PageState state="loading" title="Loading the feed" />}
      {!loading && !error && !data.items.length && <PageState state="empty" title="Start the next conversation"><p>There are no posts in this view yet.</p><Link className="glass-button mt-4" to="/submitquestion">Ask a question</Link></PageState>}
      {!error && (!loading || cursor) && <div className="feed-list">{data.items.map((post) => {
        const name = post.type === "job" ? post.company || "Company" : post.author?.displayName || post.author?.username || "Community member";
        const href = post.type === "job" ? "/jobs/" + post._id : "/posts/" + post.slug;
        return <article className="feed-card" key={post._id}>
          <div className="feed-card-meta"><Avatar name={name} src={post.type === "job" ? undefined : post.author?.avatar} size="small" /><div><strong>{name}</strong>{post.createdAt && <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>}</div><span className="post-kind">{post.type}</span></div>
          <h2><Link to={href}>{post.title}</Link></h2><p>{post.excerpt || post.description || String(post.contentText || "").slice(0, 220)}</p>
          <div className="feed-tags">{post.tags?.map((tag) => <Link className="topic-chip" to={"/topics/" + tag} key={tag}>{tag}</Link>)}</div>
          <footer>{post.type === "job" ? <span>{post.location || "Location not provided"}</span> : <div className="feed-stats"><span><FiThumbsUp aria-hidden="true" />{post.score || 0} votes</span>{post.type === "question" && <span><FiMessageCircle aria-hidden="true" />{post.answerCount || 0} answers</span>}<span><FiEye aria-hidden="true" />{post.views || 0} views</span></div>}<Link to={href}>{post.type === "job" ? "View role" : post.type === "article" ? "Read article" : "Join discussion"}<FiArrowUpRight aria-hidden="true" /></Link></footer>
        </article>;
      })}</div>}
      {data.nextCursor && <button type="button" className="glass-button feed-load-more" aria-busy={loading} disabled={loading} onClick={() => setCursor(data.nextCursor)}>{loading ? "Loading…" : "Load more"}</button>}
    </section><aside className="feed-sidebar" aria-label="Community highlights">
      <section className="surface-card"><h2>Explore topics</h2><div className="feed-tags">{side.topics.map((topic) => <Link className="topic-chip" key={topic.slug} to={"/topics/" + topic.slug}>{topic.name}</Link>)}</div>{!side.topics.length && <p>Topics will appear as the community grows.</p>}</section>
      <section className="surface-card"><h2>People making a difference</h2>{side.people.map((person) => <div className="contributor-preview" key={person.userId}><Avatar name={person.displayName || person.username || "Member"} src={person.avatar} size="small" /><div><strong>{person.displayName || person.username || "Member"}</strong><span>{Number(person.points).toLocaleString("en-IN")} reputation</span></div></div>)}{!side.people.length && <p>Contributors will appear here as they share.</p>}<Link className="rail-link" to="/rankings">View rankings <FiArrowUpRight aria-hidden="true" /></Link></section>
      <section className="surface-card"><h2>Your next opportunity</h2>{side.jobs.map((job) => <p key={job._id}><Link to={"/jobs/" + job._id}>{job.title}</Link><br /><span>{job.company}</span></p>)}{!side.jobs.length && <p>No new roles to show yet.</p>}<Link className="rail-link" to="/jobs">Explore jobs <FiArrowUpRight aria-hidden="true" /></Link></section>
      <section className="surface-card"><h2>Conversations worth joining</h2>{side.discussions.map((post) => <p key={post._id}><Link to={"/posts/" + post.slug}>{post.title}</Link><br /><span>{post.answerCount || 0} answers</span></p>)}{!side.discussions.length && <p>Ask a question to get the conversation started.</p>}</section>
    </aside></div>
  </main>;
};
export default Home;
