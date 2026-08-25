import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiBookmark, FiMessageSquare, FiSearch, FiTrendingUp } from "react-icons/fi";
import { publishingApi } from "../../../services/publishing.api";
import "./publishing.css";

const FeedCard = ({ post }) => (
  <article className="publish-card">
    <div className="publish-card__meta">
      <span className={`type-pill type-pill--${post.type}`}>{post.type}</span>
      <span>{post.author?.displayName || post.author?.username || "Developer"}</span>
      <span>·</span>
      <span>{post.readingTime ? `${post.readingTime} min read` : `${post.views || 0} views`}</span>
    </div>
    <Link to={`/posts/${post.slug}`} className="publish-card__title">{post.title}</Link>
    {post.subtitle && <p className="publish-card__subtitle">{post.subtitle}</p>}
    <p className="publish-card__excerpt">{post.excerpt || post.contentText?.slice(0, 220)}</p>
    <div className="publish-card__tags">{(post.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}</div>
    <div className="publish-card__stats">
      <span><FiTrendingUp /> {post.score || 0}</span>
      <span><FiMessageSquare /> {post.answerCount || post.commentCount || 0}</span>
      <button aria-label="Bookmark"><FiBookmark /></button>
    </div>
  </article>
);

const PublishingHome = () => {
  const [params, setParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(params.get("q") || "");
  const type = params.get("type") || "all";

  const apiParams = useMemo(() => ({
    ...(type !== "all" ? { type } : {}),
    ...(params.get("q") ? { q: params.get("q") } : {}),
    limit: 20,
  }), [params, type]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const request = params.get("q") ? publishingApi.search(apiParams) : publishingApi.getFeed(apiParams);
    request
      .then((res) => active && setPosts(res.data?.data?.posts || res.data?.data || []))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [apiParams, params]);

  const applyType = (nextType) => {
    const next = new URLSearchParams(params);
    if (nextType === "all") next.delete("type"); else next.set("type", nextType);
    setParams(next);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set("q", search.trim()); else next.delete("q");
    setParams(next);
  };

  return (
    <main className="publishing-shell">
      <aside className="publishing-sidebar">
        <Link to="/" className="side-link active">For you</Link>
        <button className="side-link" onClick={() => applyType("question")}>Questions</button>
        <button className="side-link" onClick={() => applyType("article")}>Articles</button>
        <Link to="/write" className="side-link strong">Write</Link>
        <Link to="/bookmarks" className="side-link">Bookmarks</Link>
      </aside>

      <section className="publishing-feed">
        <div className="feed-header">
          <div><span className="eyebrow">Developer knowledge</span><h1>Learn, ask, and publish.</h1></div>
          <Link className="write-button" to="/write">Write</Link>
        </div>

        <form className="feed-search" onSubmit={submitSearch}>
          <FiSearch />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions, articles, tags..." />
        </form>

        <div className="feed-tabs">
          {["all", "question", "article"].map((item) => (
            <button key={item} className={type === item ? "active" : ""} onClick={() => applyType(item)}>
              {item === "all" ? "For You" : `${item[0].toUpperCase()}${item.slice(1)}s`}
            </button>
          ))}
        </div>

        {loading && <div className="feed-state">Loading feed…</div>}
        {error && <div className="feed-state error">{error}</div>}
        {!loading && !error && posts.length === 0 && <div className="feed-state">No posts found.</div>}
        <div className="feed-list">{posts.map((post) => <FeedCard post={post} key={post._id || post.slug} />)}</div>
      </section>

      <aside className="publishing-rail">
        <div className="rail-card"><h3>Trending topics</h3><span>#backend</span><span>#javascript</span><span>#system-design</span><span>#databases</span></div>
        <div className="rail-card"><h3>Build your knowledge graph</h3><p>Follow developers and topics to make the feed more relevant over time.</p></div>
      </aside>
    </main>
  );
};

export default PublishingHome;
