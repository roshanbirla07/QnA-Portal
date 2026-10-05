import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { apiConnector } from "../../../services/apiConnector";
import { POSTS_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import "./ArticleReader.css";
const ArticleReader = ({ post }) => {
  const { token } = useAuth(), navigate = useNavigate();
  const [saved, setSaved] = useState(false), [related, setRelated] = useState([]);
  const tag = post.tags?.[0] || "", id = post._id;
  const text = typeof post.content === "string" ? post.content : post.contentText;
  const headings = (text || "").split("\n").filter((line) => /^#{2,3} /.test(line)).map((line) => line.replace(/^#+ /, ""));
  let heading = 0;
  useEffect(() => {
    let active = true;
    if (tag) apiConnector("GET", POSTS_ROUTER.replace(/\/posts$/, "/feed"), null, null, { tag, limit: 6 }).then((response) => { if (active) setRelated(response.data.data.items.filter((item) => item._id !== id)); }).catch(() => {});
    if (token) apiConnector("GET", POSTS_ROUTER.replace(/\/posts$/, "/interactions/bookmarks")).then((response) => { if (active) setSaved(response.data.data.some((item) => item._id === id)); }).catch(() => {});
    return () => { active = false; };
  }, [id, tag, token]);
  const bookmark = async () => {
    if (!token) { navigate("/login"); return; }
    try { await apiConnector(saved ? "DELETE" : "POST", POSTS_ROUTER.replace(/\/posts$/, "/interactions/bookmarks/" + id)); setSaved(!saved); } catch (reason) { toast.error(reason.message); }
  };
  return <div className="article-reader">
    <nav aria-label="Breadcrumb" className="article-crumb"><Link to="/">Community</Link> / <span>Articles</span></nav>
    <div className="article-layout"><article>
      <header className="article-header"><p className="article-eyebrow">COMMUNITY ARTICLE</p><h1>{post.title}</h1>{post.subtitle && <p className="article-subtitle">{post.subtitle}</p>}
        <div className="article-author">{post.author?.avatar && <img src={post.author.avatar} alt="" width="44" height="44" />}<div><strong>{post.author?.displayName || post.author?.username || "Community author"}</strong><p>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Published article"} · {post.readingTime || Math.max(1, Math.ceil((text || "").split(/\s+/).length / 220))} min read</p></div></div>
        <div className="article-tags">{post.tags?.map((topic) => <Link to={"/topics/" + topic} className="topic-chip" key={topic}>{topic}</Link>)}</div>
        <div className="article-controls"><button onClick={bookmark}>{saved ? "Saved" : "Save article"}</button><button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); } catch { toast.error("Could not copy link"); } }}>Share</button></div>
      </header>
      {post.coverImage && /^https?:\/\//.test(post.coverImage) && <img className="article-cover" src={post.coverImage} alt={post.title} loading="lazy" />}
      <div className="article-prose"><ReactMarkdown components={{
        h2: ({ children }) => <h2 id={"section-" + heading++}>{children}</h2>,
        h3: ({ children }) => <h3 id={"section-" + heading++}>{children}</h3>,
        code: ({ className, children }) => {
          const language = /language-(\w+)/.exec(className || "");
          return language ? <SyntaxHighlighter language={language[1]} style={oneLight} PreTag="div">{String(children).replace(/\n$/, "")}</SyntaxHighlighter> : <code className={className}>{children}</code>;
        },
      }}>{text || ""}</ReactMarkdown></div>
      <footer className="article-author-card"><h2>About the author</h2><strong>{post.author?.displayName || post.author?.username || "Community author"}</strong>{post.author?.bio && <p>{post.author.bio}</p>}{typeof post.author?.reputation === "number" && <p>{post.author.reputation} reputation points</p>}</footer>
    </article><aside className="article-aside">{!!headings.length && <section><h2>On this page</h2><nav aria-label="Table of contents">{headings.map((title, index) => <a key={index} href={"#section-" + index}>{title}</a>)}</nav></section>}
      <section><h2>Related reading</h2>{related.length ? related.map((item) => <Link to={"/posts/" + item.slug} key={item._id}>{item.title}<small>{item.type}</small></Link>) : <p>No related posts yet.</p>}</section>
    </aside></div>
  </div>;
};
export default ArticleReader;
