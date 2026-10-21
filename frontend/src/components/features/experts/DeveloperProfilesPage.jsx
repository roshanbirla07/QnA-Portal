import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FiArrowUpRight, FiUsers, FiSearch } from "react-icons/fi";
import PlatformSummary, { platforms, PlatformIdentity } from "./PlatformSummary";
import DeveloperProfileSettings from "./DeveloperProfileSettings";
import PageState from "../../common/PageState";
import SearchField from "../../common/SearchField";
import { apiConnector } from "../../../services/apiConnector";
import { DEVELOPER_PROFILES_ROUTER } from "../../../services/apis";
import "./developer-profiles.css";

const DeveloperDirectory = () => {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState({
    q: params.get("q") || "",
    skill: params.get("skill") || "",
    platform: params.get("platform") || "",
  });
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const queryKey = params.toString();

  useEffect(() => {
    const current = new URLSearchParams(queryKey);
    setDraft({ q: current.get("q") || "", skill: current.get("skill") || "", platform: current.get("platform") || "" });
  }, [queryKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const requestParams = Object.fromEntries(new URLSearchParams(queryKey).entries());
    apiConnector("GET", DEVELOPER_PROFILES_ROUTER, null, null, requestParams)
      .then((response) => { if (active) setData(response.data.data); })
      .catch(() => { if (active) setError("Developer profiles could not be loaded. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [queryKey, retry]);

  const reset = () => {
    setDraft({ q: "", skill: "", platform: "" });
    setParams({});
  };
  const hasFilters = Boolean(params.get("q") || params.get("skill") || params.get("platform"));

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (draft.q.trim()) next.q = draft.q.trim();
    if (draft.skill.trim()) next.skill = draft.skill.trim().toLowerCase();
    if (draft.platform) next.platform = draft.platform;
    setParams(next);
  };

  return (
    <main className="developer-page">
      <header className="developer-directory-heading">
        <div className="developer-page-heading">
          <p className="feed-eyebrow">DEVELOPER DIRECTORY</p>
          <h1>Find the people behind the work</h1>
          <p>Explore code, contest activity, writing, and community contributions. Get to know developers through what they share.</p>
        </div>
        <Link className="glass-button" to="/developer-profile">Connect your profiles <FiArrowUpRight aria-hidden="true" /></Link>
      </header>

      <form className="developer-filter surface-card" noValidate onSubmit={submit}>
        <div className="developer-search-row">
          <div className="developer-search-control">
            <label htmlFor="developer-search">Name or location</label>
            <SearchField id="developer-search" label="Search developers" placeholder="Search name, headline, location"
              value={draft.q} onChange={(q) => setDraft((value) => ({ ...value, q }))} />
          </div>
          <div className="developer-search-control">
            <label htmlFor="developer-skill">Skill or topic</label>
            <SearchField id="developer-skill" label="Skill" placeholder="e.g. Kafka, React, Python"
              value={draft.skill} onChange={(skill) => setDraft((value) => ({ ...value, skill }))} />
          </div>
          <button className="btn-primary" type="submit"><FiSearch aria-hidden="true" /> Find developers</button>
        </div>
        <fieldset className="developer-platform-filters">
          <legend>Connected platform</legend>
          <div className="developer-platform-options">
            <button className="glass-button" type="button" aria-pressed={!draft.platform}
              onClick={() => setDraft((value) => ({ ...value, platform: "" }))}>All platforms</button>
            {platforms.map((platform) => <button className="glass-button" type="button" key={platform.id}
              aria-pressed={draft.platform === platform.id}
              onClick={() => setDraft((value) => ({ ...value, platform: platform.id }))}>
              <PlatformIdentity platform={platform.id} />
            </button>)}
          </div>
        </fieldset>
      </form>

      <div className="developer-results-heading">
        <h2>Developers{!loading && !error && <span>{data.total.toLocaleString("en-IN")}</span>}</h2>
        {hasFilters && <button type="button" className="glass-button" onClick={reset}>Clear filters</button>}
      </div>
      <div className="developer-results" aria-busy={loading}>
      {loading ? <PageState state="loading" title="Loading developers…" /> :
        error ? <PageState state="error" title="Unable to load developers"><p>{error}</p><button type="button" className="glass-button" onClick={() => setRetry((value) => value + 1)}>Try again</button></PageState> :
        data.items?.length ? (
          <section className="developer-directory" aria-label="Developer profiles">
            {data.items.map(({ user, accounts, topicEvidence }) => (
              <article className="surface-card developer-card" key={user._id}>
                <div className="developer-card-head">
                  <div className="member-avatar">{(user.displayName || user.username || "D")[0]}</div>
                  <div>
                    <h2><Link to={`/developers/${user.username}`}>{user.displayName || user.username}</Link></h2>
                    {user.headline && <p>{user.headline}</p>}
                    {user.location && <span>{user.location}</span>}
                  </div>
                </div>
                {user.openToOpportunities && <p className="developer-open">Open to opportunities</p>}
                <div className="developer-skills">
                  {topicEvidence?.slice(0, 4).map((evidence) => (
                    <span className="topic-chip" key={evidence.topic}>#{evidence.topic} · {evidence.reputation}</span>
                  ))}
                  {accounts?.filter((account) => account.visibility !== "hidden").flatMap((account) => account.skills || []).filter((skill, index, all) => all.indexOf(skill) === index)
                    .slice(0, 5).map((skill) => <span className="topic-chip" key={skill}>#{skill}</span>)}
                </div>
                <section className="developer-card-work" aria-label="Work">
                  <h3>Work</h3>
                  <div className="developer-work-grid">{accounts?.filter((account) => account.visibility !== "hidden").map((account) => <PlatformSummary key={account.platform} account={account} />)}</div>
                  {!accounts?.length && <p className="developer-note">No public connected platforms yet.</p>}
                </section>
                <Link className="glass-button" to={`/developers/${user.username}`}>View evidence</Link>
              </article>
            ))}
          </section>
         ) : <PageState state="empty" title={hasFilters ? "No developers found" : "Make your work discoverable"}>
          <span className="developer-empty-icon"><FiUsers aria-hidden="true" /></span>
          <p>{hasFilters ? "Try another skill, name, or platform to broaden your search." : "Connect your technical profiles and publish your developer profile to appear here."}</p>
          {hasFilters ? <button type="button" className="glass-button" onClick={reset}>Clear filters</button> :
            <Link className="btn-primary" to="/developer-profile">Connect your profiles <FiArrowUpRight aria-hidden="true" /></Link>}
        </PageState>}
      </div>
      {!loading && !error && (data.page > 1 || data.hasMore) && <nav className="developer-pagination" aria-label="Developer pages">
        <button className="glass-button" disabled={data.page <= 1} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("page", String(data.page - 1)); return next; })}>Previous</button>
        <span>Page {data.page}</span>
        <button className="glass-button" disabled={!data.hasMore} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("page", String(data.page + 1)); return next; })}>Next</button>
      </nav>}
      <p className="developer-directory-note">Public profiles only. Synced data confirms the source, not account ownership. No hiring scores.</p>
    </main>
  );
};

const PublicDeveloperProfile = ({ username }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    setData(null);
    apiConnector("GET", `${DEVELOPER_PROFILES_ROUTER}/${encodeURIComponent(username)}`)
      .then((response) => { if (active) setData(response.data.data); })
      .catch(() => { if (active) setError("This profile is unavailable or could not be loaded."); });
    return () => { active = false; };
  }, [username, retry]);

  if (error) return <main className="developer-page"><PageState state="error" title="Profile unavailable"><p>{error}</p><button className="glass-button" onClick={() => setRetry((value) => value + 1)}>Try again</button></PageState></main>;
  if (!data) return <main className="developer-page"><PageState state="loading" title="Loading developer work…" /></main>;

  const { user, topicEvidence } = data;
  const accounts = data.accounts.filter((account) => account.visibility !== "hidden");
  return (
    <main className="developer-page">
      <header className="surface-card developer-profile-hero">
        <div className="member-avatar">{(user.displayName || user.username || "D")[0]}</div>
        <div>
          <p className="feed-eyebrow">DEVELOPER PROFILE</p>
          <h1>{user.displayName || user.username}</h1>
          {user.headline && <p>{user.headline}</p>}
          <div className="developer-profile-meta">
            {user.location && <span>{user.location}</span>}
            {user.openToOpportunities && <span className="developer-open">Open to opportunities</span>}
          </div>
        </div>
      </header>

      {user.bio && <section className="surface-card developer-section"><h2>About</h2><p>{user.bio}</p></section>}

      <section className="developer-section">
        <div className="developer-section-heading"><div><h2>Work</h2><p>Public profiles linked by this developer.</p></div></div>
        {accounts.length ? <div className="developer-evidence-grid">{accounts.filter((account) => account.visibility !== "hidden").map((account) => <PlatformSummary key={account.platform} account={account} />)}</div> :
          <p>No external profiles are public yet.</p>}
      </section>

      <section className="surface-card developer-section">
        <h2>QnA topic evidence</h2>
        <p className="developer-note">Topic reputation is earned from contributions on QnA Portal.</p>
        <div className="developer-skills">
          {topicEvidence.length ? topicEvidence.map((item) => (
            <Link className="topic-chip" to={`/topics/${item.topic}`} key={item.topic}>#{item.topic} · {item.reputation}</Link>
          )) : <span>No topic reputation yet.</span>}
        </div>
      </section>
    </main>
  );
};

const DeveloperProfilesPage = ({ manage = false }) => {
  const { username } = useParams();
  if (manage) return <DeveloperProfileSettings />;
  if (username) return <PublicDeveloperProfile username={username} />;
  return <DeveloperDirectory />;
};

export default DeveloperProfilesPage;
