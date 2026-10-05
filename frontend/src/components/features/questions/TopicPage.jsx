import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { TOPICS_ROUTER, JOBS_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";
import "./TopicPage.css";
const tabs = ["Overview", "Questions", "Articles", "Contributors", "Jobs"];
const TopicPage = () => {
  const { slug } = useParams(), { token } = useAuth(), navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : "Overview", sort = params.get("sort") || "top";
  const type = tab === "Questions" ? "question" : tab === "Articles" ? "article" : "";
  const [data, setData] = useState(null), [jobs, setJobs] = useState([]), [error, setError] = useState(""), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    apiConnector("GET", TOPICS_ROUTER + "/" + encodeURIComponent(slug), null, null, { sort, ...(type ? { type } : {}) })
      .then((response) => { if (active) setData(response.data.data); }).catch((reason) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, sort, type, token, reload]);
  useEffect(() => {
    let active = true;
    if (tab === "Jobs") apiConnector("GET", JOBS_ROUTER, null, null, { q: slug.replace(/-/g, " "), limit: 10 }).then((response) => { if(active) setJobs(response.data.data.items); }).catch(() => { if(active) setJobs([]); });
    return () => { active = false; };
  }, [slug, tab]);
  const follow = async () => {
    if (!token) { navigate("/login"); return; }
    setBusy(true);
    try { await apiConnector(data.isFollowing ? "DELETE" : "POST", TOPICS_ROUTER + "/" + slug + "/follow"); setReload((value) => value + 1); }
    catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  if (loading && !data) return <main className="topic-page" role="status">Loading topic…</main>;
  if (error && !data) return <main className="topic-page" role="alert">{error}</main>;
  if (!data) return null;
  const related = [...new Set(data.posts.flatMap((post) => post.tags || []))].filter((tag) => tag !== slug).slice(0, 8);
  return <main className="topic-page">
    <nav className="topic-breadcrumb" aria-label="Breadcrumb"><Link to="/">Community</Link> / Topics / {data.topic.name}</nav>
    <header className="topic-hero"><div><p>TOPIC HUB</p><h1>{data.topic.name}</h1><div className="topic-description">{data.topic.description || "Questions, practical articles and people sharing what they know."}</div><div className="topic-stats"><span>{data.topic.postCount || 0} posts</span><span>{data.topic.followersCount || 0} followers</span></div></div><button className="btn-primary" disabled={busy} onClick={follow}>{data.isFollowing ? "Following" : "Follow topic"}</button></header>
    <nav className="topic-tabs" aria-label="Topic sections">{tabs.map((name) => <button key={name} aria-current={tab === name ? "page" : undefined} onClick={() => setParams({ tab: name, sort })}>{name}</button>)}</nav>
    {error && <p role="alert">{error}</p>}
    <div className="topic-layout"><section>
      {["Overview", "Questions", "Articles"].includes(tab) && <><div className="topic-section-title"><h2>{tab === "Overview" ? "Latest knowledge" : tab}</h2><label>Sort <select className="input-field" value={sort} onChange={(event) => setParams({ tab, sort: event.target.value })}><option value="top">Top</option><option value="newest">Newest</option><option value="trending">Trending</option><option value="unanswered">Unanswered questions</option></select></label></div>
        {loading ? <p role="status">Loading posts…</p> : data.posts.length ? data.posts.map((post) => <article className="topic-post" key={post._id}><p>{post.type} · {post.author?.displayName || post.author?.username || "Member"}</p><h3><Link to={"/posts/" + post.slug}>{post.title}</Link></h3><div>{post.excerpt || post.contentText?.slice(0, 200)}</div><footer>{post.score || 0} votes · {post.answerCount || 0} answers</footer></article>) : <div className="topic-post">No posts in this section yet. <Link to="/submitquestion">Ask a question</Link>.</div>}</>}
      {tab === "Contributors" && <><h2 className="topic-section-title">Topic contributors</h2>{data.topContributors.length ? data.topContributors.map((person, index) => <article className="topic-person" key={person.userId}><span className="topic-rank">{index + 1}</span><div><h3>{person.displayName || person.username || "Contributor"}</h3><p>{person.headline}</p></div><strong>{person.reputation} topic reputation</strong></article>) : <p>No topic reputation yet.</p>}<Link to={"/experts?topic=" + slug}>Discover experts →</Link></>}
      {tab === "Jobs" && <><h2 className="topic-section-title">Roles mentioning {data.topic.name}</h2>{jobs.length ? jobs.map((job) => <article className="topic-post" key={job._id}><h3><Link to={"/jobs/" + job._id}>{job.title}</Link></h3><p>{job.company} · {job.location || "Location not provided"}</p></article>) : <p>No related roles yet.</p>}</>}
    </section><aside><section className="surface-card p-5"><h2>Leading contributors</h2>{data.topContributors.slice(0, 4).map((person) => <p key={person.userId}><strong>{person.displayName || person.username || "Member"}</strong><br /><span>{person.reputation} topic reputation</span></p>)}<Link to={"/experts?topic=" + slug}>Find experts →</Link></section><section className="surface-card p-5 mt-5"><h2>Related topics</h2><div className="topic-related">{related.map((topic) => <Link to={"/topics/" + topic} className="topic-chip" key={topic}>{topic}</Link>)}</div>{!related.length && <p>Related topics appear as posts connect them.</p>}</section></aside></div>
  </main>;
};
export default TopicPage;
