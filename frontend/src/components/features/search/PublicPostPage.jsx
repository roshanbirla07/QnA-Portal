import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { POSTS_ROUTER } from "../../../services/apis";

import QuestionDetail from "../questions/QuestionDetail";

const PublicPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    apiConnector("GET", `${POSTS_ROUTER}/${encodeURIComponent(slug)}`)
      .then((response) => { if (active) setPost(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [slug]);
  if (post?.type === "question") return <QuestionDetail post={post} />;
  return <main className="max-w-3xl mx-auto px-4 py-10 text-text-primary">
    <Link to="/search" className="text-primary-blue">← Search</Link>
    {error ? <p role="alert" className="mt-6 text-red-400">{error}</p> : !post ? <p className="mt-6">Loading post…</p> : <article className="mt-6">
      <p className="text-sm text-text-muted capitalize">{post.type}</p>
      <h1 className="text-3xl font-bold mt-2">{post.title}</h1>
      <p className="text-text-secondary mt-2">{post.author?.displayName || post.author?.username || "Member"}</p>
      <div className="flex gap-2 flex-wrap mt-4">{post.tags?.map((tag) => <Link to={`/topics/${tag}`} key={tag} className="text-primary-blue">#{tag}</Link>)}</div>
      <div className="whitespace-pre-wrap leading-relaxed mt-8">{post.contentText}</div>
    </article>}
  </main>;
};

export default PublicPostPage;

