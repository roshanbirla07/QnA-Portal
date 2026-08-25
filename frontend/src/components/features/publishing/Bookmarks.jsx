import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publishingApi } from "../../../services/publishing.api";
import "./publishing.css";

const Bookmarks = () => {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    publishingApi.getBookmarks().then((res) => setPosts(res.data?.data || [])).catch(() => setPosts([]));
  }, []);
  return <main className="reader-shell"><h1>Bookmarks</h1><div className="feed-list">{posts.map((item) => {
    const post = item.post || item;
    return <article className="publish-card" key={post._id}><span className={`type-pill type-pill--${post.type}`}>{post.type}</span><Link className="publish-card__title" to={`/posts/${post.slug}`}>{post.title}</Link><p>{post.excerpt}</p></article>;
  })}</div></main>;
};

export default Bookmarks;
