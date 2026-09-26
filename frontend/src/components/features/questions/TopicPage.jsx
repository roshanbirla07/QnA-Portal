import React, { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import QuestionCard from "../../common/QuestionCard";
import { TOPICS_ROUTER } from "../../../services/apis";
import { getAuthHeaders } from "../../../utils/request";
import toast from "react-hot-toast";

const TopicPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get("sort") || "top";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${TOPICS_ROUTER}/${encodeURIComponent(slug)}?sort=${encodeURIComponent(sort)}`,
        { headers: getAuthHeaders(), credentials: "include" }
      );
      if (!response.ok) throw new Error("Unable to load topic");
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [slug, sort]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    try {
      const response = await fetch(`${TOPICS_ROUTER}/${encodeURIComponent(slug)}/follow`, {
        method: data?.isFollowing ? "DELETE" : "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Please sign in to follow topics");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-bg-primary pt-24 text-center text-text-secondary">Loading topic...</div>;
  if (!data) return <div className="min-h-screen bg-bg-primary pt-24 text-center text-text-secondary">Topic not found.</div>;

  return (
    <div className="min-h-screen bg-bg-primary pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-primary-purple">Topic</p>
              <h1 className="text-4xl font-bold text-text-primary">#{data.topic.name}</h1>
              {data.topic.description && <p className="mt-3 text-text-secondary max-w-3xl">{data.topic.description}</p>}
              <div className="mt-3 text-sm text-text-muted">
                {data.topic.postCount || 0} posts · {data.topic.followersCount || 0} followers
              </div>
            </div>
            <button onClick={toggleFollow} className="btn-primary">
              {data.isFollowing ? "Following" : "Follow topic"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {["top", "newest", "trending", "unanswered"].map((item) => (
            <button
              key={item}
              onClick={() => setSearchParams({ sort: item })}
              className={`px-4 py-2 rounded-lg border capitalize ${sort === item ? "border-primary-purple text-white bg-primary-purple/20" : "border-white/10 text-text-secondary"}`}
            >
              {item}
            </button>
          ))}
        </div>

        {data.posts.length === 0 ? (
          <div className="text-center text-text-muted py-16">No posts in this topic yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.posts.map((post) => (
              <QuestionCard
                key={post._id}
                question={{ ...post, questionTitle: post.title, status: post.status === "published" ? "approved" : post.status }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicPage;
