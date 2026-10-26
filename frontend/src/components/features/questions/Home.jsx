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
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [highlightsError, setHighlightsError] = useState(false);
  const [highlightsRetry, setHighlightsRetry] = useState(0);
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
    setHighlightsLoading(true);
    setHighlightsError(false);
    Promise.allSettled([apiConnector("GET", TOPICS_ROUTER, null, null, { limit: 6 }), apiConnector("GET", RANKINGS_ROUTER), apiConnector("GET", JOBS_ROUTER, null, null, { limit: 3 }), apiConnector("GET", feedUrl, null, null, { sort: "trending", type: "question", limit: 3 })]).then(([topics, people, jobs, discussions]) => {
      if (active) {
        setHighlightsLoading(false);
        setHighlightsError([topics, people, jobs, discussions].some((result) => result.status === "rejected"));
        setSide({ topics: topics.status === "fulfilled" ? topics.value.data.data : [], people: people.status === "fulfilled" ? people.value.data.data.allTime.slice(0, 3) : [], jobs: jobs.status === "fulfilled" ? jobs.value.data.data.items : [], discussions: discussions.status === "fulfilled" ? discussions.value.data.data.items : [] }); }
    });
    return () => { active = false; };
  }, [highlightsRetry]);
  return <main className="feed-page">
    <header className="feed-heading">
      <span className="feed-hub-symbol" aria-hidden="true">q.</span>
      <p className="feed-eyebrow">CODE · CONTEXT · COMMUNITY</p>
      <h1>The developer community<br /><span>building in public.</span></h1>
      <p>Discover useful answers, explore what people build, and share the thinking behind your work.</p>
      <div className="feed-heading-actions"><Link to="/developers" className="btn-primary">Explore developers <FiArrowUpRight aria-hidden="true" /></Link><Link to="/submitquestion" className="glass-button">Ask a question</Link></div>
    </header>
    {side.topics.length > 0 && <nav className="feed-topic-navigation" aria-label="Explore topics"><span>Explore topics</span>{side.topics.map((topic) => <Link className="topic-chip" key={topic.slug} to={"/topics/" + topic.slug}># {topic.name}</Link>)}</nav>}
    <section className="hub-discovery" aria-label="Community discoveries" aria-busy={highlightsLoading}>
      {highlightsLoading && <PageState state="loading" title="Loading community discoveries" />}
      {highlightsError && <PageState state="error" title="Some community discoveries couldn't load"><p>Available discoveries are still shown below.</p><button className="glass-button mt-4" type="button" onClick={() => setHighlightsRetry((value) => value + 1)}>Retry discoveries</button></PageState>}
      {!highlightsLoading && <>
      <section><h2>Conversations</h2><p className="hub-column-description">Questions worth thinking about</p>
        {side.discussions.map((post) => <article className="hub-discovery-card" key={post._id}><h3><Link to={"/posts/" + post.slug}>{post.title}</Link></h3><p>{post.answerCount || 0} answers</p><div className="feed-tags">{post.tags?.slice(0, 2).map((tag) => <Link key={tag} className="topic-chip" to={"/topics/" + tag}>{tag}</Link>)}</div></article>)}
        {!side.discussions.length && <p className="hub-empty">{highlightsLoading ? "Loading conversations…" : "No public conversations to show yet."}</p>}
        <Link className="rail-link" to="/?tab=Questions">Browse questions <FiArrowUpRight aria-hidden="true" /></Link>
      </section>
      <section><h2>Developers</h2><p className="hub-column-description">People sharing their knowledge</p>
        {side.people.map((person) => <article className="hub-discovery-card" key={person.userId}><div className="contributor-preview"><Avatar name={person.displayName || person.username || "Member"} src={person.avatar} size="small" /><h3><Link to={"/developers?q=" + encodeURIComponent(person.displayName || person.username || "")}>{person.displayName || person.username || "Member"}</Link></h3></div><p>{Number(person.points).toLocaleString("en-IN")} QnA reputation</p></article>)}
        {!side.people.length && <p className="hub-empty">{highlightsLoading ? "Loading developers…" : "No public developers available."}</p>}
        <Link className="rail-link" to="/developers">Explore developers <FiArrowUpRight aria-hidden="true" /></Link>
      </section>
      <section><h2>Opportunities</h2><p className="hub-column-description">Explore your next chapter</p>
        {side.jobs.map((job) => <article className="hub-discovery-card" key={job._id}><p>{job.company}</p><h3><Link to={"/jobs/" + job._id}>{job.title}</Link></h3>{job.location && <p>{job.location}</p>}</article>)}
        {!side.jobs.length && <p className="hub-empty">{highlightsLoading ? "Loading opportunities…" : "No public roles to show yet."}</p>}
        <Link className="rail-link" to="/jobs">Browse jobs <FiArrowUpRight aria-hidden="true" /></Link>
      </section>
      </>}
    </section>
    <div className="feed-section-heading"><div><h2>From the community</h2><p>Follow the conversations and ideas that matter to you.</p></div></div>
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
    </section></div>
  </main>;
};
export default Home;
