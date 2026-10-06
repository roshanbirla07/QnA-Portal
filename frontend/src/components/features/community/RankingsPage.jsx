import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiAward, FiCheckCircle, FiArrowUpRight } from "react-icons/fi";
import { apiConnector } from "../../../services/apiConnector";
import { RANKINGS_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";
import { decodeToken } from "../../../utils/auth";
import Avatar from "../../common/Avatar";
import PageState from "../../common/PageState";
import "./RankingsPage.css";

const boards = [["monthly", "This month"], ["allTime", "All time"], ["topicLeaders", "Topic leaders"]];
const currentMonth = () => new Date().toISOString().slice(0, 7);
const format = (value) => Number(value || 0).toLocaleString("en-IN");
const RankingsPage = () => {
  const [params, setParams] = useSearchParams();
  const { token } = useAuth();
  const payload = decodeToken(token);
  const userId = String(payload._id || payload.id || payload.userId || "");
  const query = params.toString();
  const board = boards.some(([key]) => key === params.get("board")) ? params.get("board") : "monthly";
  const [month, setMonth] = useState(params.get("month") || currentMonth());
  const [topic, setTopic] = useState(params.get("topic") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");
  const [reload, setReload] = useState(0);
  const monthInput = useRef(null), topicInput = useRef(null);
  useEffect(() => {
    const values = new URLSearchParams(query);
    setMonth(values.get("month") || currentMonth());
    setTopic(values.get("topic") || "");
    setValidation("");
  }, [query]);
  useEffect(() => {
    let active = true;
    const values = new URLSearchParams(query);
    setLoading(true); setError("");
    apiConnector("GET", RANKINGS_ROUTER, null, null, { month: values.get("month") || currentMonth(), ...(values.get("topic") ? { topic: values.get("topic") } : {}) })
      .then((response) => { if (active) setData(response.data.data); })
      .catch(() => { if (active) setError("Rankings couldn't load. Check your connection or try another topic."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, reload]);
  const items = data?.[board] || [];
  const me = items.findIndex((person) => String(person.userId) === userId);
  const title = board === "monthly" ? "Monthly contributors" : board === "allTime" ? "All-time contributors" : data?.topic ? data.topic.name + " specialists" : "Topic specialists";
  const description = board === "monthly" ? "Net reputation earned in " + (data?.month || month) + " across all topics (UTC)." : board === "allTime" ? "Lifetime reputation across the community." : data?.topic ? "Lifetime reputation in #" + data.topic.slug + "." : "Each person's highest reputation in a single topic.";
  const apply = (event) => {
    event.preventDefault();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) { setValidation("Choose a valid month."); monthInput.current?.focus(); return; }
    const slug = topic.trim().toLowerCase();
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setValidation("Use a topic slug such as nodejs or system-design."); topicInput.current?.focus(); return; }
    setValidation("");
    setParams({ board, month, ...(slug ? { topic: slug } : {}) });
  };
  return <main className="rankings-page">
    <header className="rankings-heading"><div><p className="section-eyebrow">COMMUNITY RECOGNITION</p><h1>Help others. Make your mark.</h1><p>Recognizing developers who share knowledge and move conversations forward.</p></div><span className="rankings-emblem" aria-hidden="true"><FiAward /></span></header>
    <div className="rankings-controls surface-card">
      <nav className="rankings-tabs" aria-label="Ranking views">{boards.map(([key, label]) => <button type="button" key={key} aria-pressed={board === key} onClick={() => setParams({ ...Object.fromEntries(params), board: key })}>{label}</button>)}</nav>
      <form noValidate className="rankings-filters" onSubmit={apply}>
        <div><label htmlFor="ranking-month">Month</label><input ref={monthInput} id="ranking-month" type="month" className="input-field" value={month} aria-invalid={validation.startsWith("Choose") || undefined} aria-describedby={validation ? "ranking-validation" : "ranking-filter-hint"} onChange={(event) => setMonth(event.target.value)} /></div>
        <div><label htmlFor="ranking-topic">Topic <span>(optional)</span></label><div className="ranking-topic-field"><input ref={topicInput} id="ranking-topic" className="input-field" placeholder="e.g. nodejs" value={topic} aria-invalid={validation.startsWith("Use") || undefined} aria-describedby={validation ? "ranking-validation" : "ranking-filter-hint"} onChange={(event) => setTopic(event.target.value)} />
          {topic && <button type="button" aria-label="Clear topic filter" onClick={() => { setTopic(""); topicInput.current?.focus(); }}>×</button>}</div></div>
        <button type="submit" className="btn-primary">Apply filters</button>
      </form>
      {validation ? <p id="ranking-validation" className="ranking-validation" role="alert">{validation}</p> : <p id="ranking-filter-hint" className="ranking-filter-hint">Month applies to monthly rankings. Topic applies to topic leaders.</p>}
    </div>
    <section className="ranking-results" aria-label={title} aria-busy={loading}>
      {loading ? <PageState state="loading" title="Loading rankings" /> : error ? <PageState state="error" title="Rankings couldn't load"><p>{error}</p><button type="button" className="glass-button mt-4" onClick={() => setReload((value) => value + 1)}>Try again</button></PageState> : <>
        <div className="ranking-board-heading"><div><h2>{title}</h2><p>{description}</p></div><span>{items.length} contributors</span></div>
        {token && <p className="ranking-personal" role="status">{me >= 0 ? "You're #" + (me + 1) + " in this leaderboard · " + format(items[me].points) + " points." : "You're outside this leaderboard's top 50. Helpful contributions build your reputation."}</p>}
        {items.length ? <div className="ranking-table-wrap surface-card"><table className="ranking-table"><caption className="sr-only">{title + ". " + description}</caption><thead><tr><th scope="col">Rank</th><th scope="col">Contributor</th><th scope="col" className="ranking-detail">Contributions</th><th scope="col" className="ranking-points">Points</th></tr></thead>
          <tbody>{items.map((person, index) => {
            const name = person.displayName || person.username || "Member";
            const mine = String(person.userId) === userId;
            return <tr key={person.userId} className={mine ? "is-you" : undefined}>
              <td><span className={"ranking-position" + (index < 3 ? " ranking-position--leading" : "")}>{index + 1}</span></td>
              <th scope="row"><div className="ranking-person"><Avatar name={name} src={person.avatar} /><div><strong>{name}{mine && <span className="ranking-you">You</span>}</strong>{person.headline && <p>{person.headline}</p>}<div className="ranking-badges"><span>{person.trustLevel}</span>{person.badges?.slice(0, 2).map((badge) => <span key={badge}>{badge}</span>)}{board === "monthly" && data.spotlight?.some((id) => String(id) === String(person.userId)) && <span className="ranking-spotlight"><FiAward aria-hidden="true" />Spotlight</span>}</div><p className="ranking-mobile-stats">{format(person.posts)} posts · {format(person.acceptedAnswers)} accepted answers</p></div></div></th>
              <td className="ranking-detail"><span>{format(person.posts)} posts</span><span className="ranking-accepted"><FiCheckCircle aria-hidden="true" />{format(person.acceptedAnswers)} accepted</span></td>
              <td className="ranking-points"><strong>{format(person.points)}</strong><span>{board === "topicLeaders" ? "topic points" : board === "monthly" ? "net reputation" : "reputation"}</span></td>
            </tr>;
          })}</tbody></table></div> : <PageState state="empty" title="Be the first to contribute"><p>No reputation activity in this view yet.</p><Link to="/submitquestion" className="glass-button mt-4">Share a question <FiArrowUpRight aria-hidden="true" /></Link></PageState>}
      </>}
    </section>
    <p className="rankings-footnote"><FiAward aria-hidden="true" />Badges and spotlight recognize helpful contributions. They carry no monetary reward.</p>
  </main>;
};
export default RankingsPage;
