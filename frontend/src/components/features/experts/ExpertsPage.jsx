import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { EXPERTS_ROUTER } from "../../../services/apis";

const ExpertsPage = () => {
  const [params, setParams] = useSearchParams();
  const [topic, setTopic] = useState(params.get("topic") || "");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const selectedTopic = params.get("topic") || "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiConnector("GET", EXPERTS_ROUTER, null, null, selectedTopic ? { topic: selectedTopic } : {})
      .then((response) => { if (active) setData(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedTopic]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary">
      <h1 className="text-3xl font-bold">Find contributors and experts</h1>
      <p className="text-text-secondary mt-2">Ranked from topic reputation, accepted answers and published contributions.</p>
      <form onSubmit={(event) => { event.preventDefault(); setParams(topic.trim() ? { topic: topic.trim() } : {}); }}
        className="flex flex-wrap gap-3 my-8">
        <input aria-label="Topic" placeholder="Filter by topic, e.g. kafka" value={topic}
          onChange={(event) => setTopic(event.target.value)} className="input-field flex-1 min-w-48" />
        <button type="submit" className="btn-primary">Find experts</button>
      </form>
      {loading ? <p>Loading experts…</p> : error ? <p role="alert" className="text-red-400">{error}</p> :
        <>
          {data.topic && <p className="mb-5">Experts in <Link className="text-primary-blue underline" to={`/topics/${data.topic.slug}`}>#{data.topic.name}</Link></p>}
          {data.experts.length ? <div className="grid md:grid-cols-2 gap-4">
            {data.experts.map((expert) => <article key={expert.userId} className="surface-card p-6">
              <div className="flex items-center gap-3 mb-4">{expert.avatar ? <img src={expert.avatar} alt="" width="48" height="48" className="rounded-full object-cover" /> : <span aria-hidden="true" className="rounded-full bg-primary-blue/10 text-primary-blue w-12 h-12 grid place-items-center font-bold">{(expert.displayName || expert.username || "C")[0]}</span>}<h2 className="text-xl font-semibold">{expert.displayName || expert.username || "Contributor"}</h2></div>
              {expert.headline && <p className="text-text-secondary">{expert.headline}</p>}
              <p className="text-sm text-text-secondary mt-4 border-t pt-4">
                {expert.reputation} topic reputation · {expert.acceptedAnswers} accepted answers · {expert.contributions} posts
              </p>
            <Link to="/connections" className="glass-button inline-block mt-4">Connect with purpose</Link></article>)}
          </div> : <p>No contributors found for this topic yet.</p>}
        </>}
    </main>
  );
};

export default ExpertsPage;

