import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiConnector } from "../../../services/apiConnector";
import { RANKINGS_ROUTER } from "../../../services/apis";

const Board = ({ title, items, unit, spotlight = [] }) => <section className="rounded-xl border border-white/10 bg-bg-secondary p-6">
  <h2 className="text-2xl font-semibold mb-4">{title}</h2>
  {items.length ? <ol className="space-y-3">{items.map((item, index) => <li key={item.userId} className="border-b border-white/10 pb-3">
    <div className="flex flex-wrap justify-between gap-2"><strong>{index + 1}. {item.displayName || item.username || "Member"}</strong>
      <span>{item.points} {unit}{spotlight.includes(item.userId) && " · Monthly spotlight"}</span></div>
    <p className="text-sm text-text-secondary">{item.headline} · {item.trustLevel} · {item.posts} posts · {item.acceptedAnswers} accepted answers</p>
    {!!item.badges.length && <p className="text-sm text-primary-blue mt-1">{item.badges.join(" · ")}</p>}
  </li>)}</ol> : <p className="text-text-secondary">No activity to rank yet.</p>}
</section>;

const RankingsPage = () => {
  const [params, setParams] = useSearchParams();
  const [month, setMonth] = useState(params.get("month") || new Date().toISOString().slice(0, 7));
  const [topic, setTopic] = useState(params.get("topic") || "");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiConnector("GET", RANKINGS_ROUTER, null, null, Object.fromEntries(params.entries()))
      .then((response) => { if (active) { setData(response.data.data); setError(""); } })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.toString()]);

  return <main className="max-w-5xl mx-auto px-4 py-10 text-text-primary space-y-6">
    <header><h1 className="text-3xl font-bold">Contributor rankings</h1>
      <p className="text-text-secondary mt-2">Recognizing helpful contributions. Badges and spotlight are community recognition, with no monetary reward.</p></header>
    <form onSubmit={(event) => { event.preventDefault(); setParams({ month, ...(topic.trim() ? { topic: topic.trim().toLowerCase() } : {}) }); }} className="flex flex-wrap gap-3">
      <label>Month <input type="month" className="input-field ml-2" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      <label>Topic <input className="input-field ml-2" placeholder="Optional topic slug" value={topic} onChange={(event) => setTopic(event.target.value)} /></label>
      <button className="btn-primary" type="submit">Show rankings</button>
    </form>
    {loading ? <p>Loading rankings…</p> : error ? <p role="alert" className="text-red-400">{error}</p> : <>
      <Board title={`Monthly · ${data.month} (all topics)`} items={data.monthly} unit="net reputation points" spotlight={data.spotlight} />
      <Board title="All-time reputation" items={data.allTime} unit="reputation points" />
      <Board title={data.topic ? `Topic leaders · #${data.topic.slug}` : "Topic specialists"} items={data.topicLeaders} unit="topic points" />
    </>}
  </main>;
};

export default RankingsPage;
