import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { POSTS_ROUTER } from "../../../services/apis";
import ArticleReader from "./ArticleReader";

import QuestionDetail from "../questions/QuestionDetail";

const PublicPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setPost(null);
    setError("");
    apiConnector("GET", `${POSTS_ROUTER}/${encodeURIComponent(slug)}`)
      .then((response) => { if (active) setPost(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [slug]);
  if (post?.type === "question") return <QuestionDetail post={post} />;
  return <main className="text-text-primary">
    {error ? <p role="alert" className="mt-6 text-red-400">{error}</p> : !post ? <p className="mt-6">Loading post…</p> : <ArticleReader post={post} />}
  </main>;
};

export default PublicPostPage;
