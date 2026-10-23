import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FiArrowUpRight, FiUsers, FiSearch } from "react-icons/fi";
import PlatformSummary, { platforms, PlatformIdentity } from "./PlatformSummary";
import DeveloperProfileSettings from "./DeveloperProfileSettings";
import Avatar from "../../common/Avatar";
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

  const requestParams = new URLSearchParams(params);
  requestParams.delete("developer");
  requestParams.delete("work");
  const queryKey = requestParams.toString();
  const selected = data.items?.find(({ user }) => user.username === params.get("developer")) || data.items?.[0];
  const publicAccounts = selected?.accounts?.filter((account) => account.visibility !== "hidden") || [];
  const activeAccount = publicAccounts.find((account) => account.platform === params.get("work"))
    || publicAccounts.find((account) => account.platform === params.get("platform")) || publicAccounts[0];
  const selectDeveloper = (username) => setParams((current) => {
    const next = new URLSearchParams(current);
    next.set("developer", username);
    next.delete("work");
    return next;
  });
  const selectPlatform = (platform) => setParams((current) => {
    const next = new URLSearchParams(current);
    next.set("developer", selected.user.username);
    next.set("work", platform);
    return next;
  });

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
          <h1>Developer explorer</h1>
          <p>Find a developer. Explore their code, contest activity, and writing in one place.</p>
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
          <div className="developer-explorer">
            <aside className="surface-card developer-explorer-list" aria-label="Developer profiles">
              <p className="developer-explorer-label">Select a developer</p>
              <label className="developer-mobile-picker">Developer
                <select className="input-field" value={selected.user.username} onChange={(event) => selectDeveloper(event.target.value)}>
                  {data.items.map(({ user }) => <option key={user._id} value={user.username}>{user.displayName || user.username}</option>)}
                </select>
              </label>
              <ul className="developer-explorer-people">
                {data.items.map(({ user, accounts }) => (
                  <li key={user._id}>
                    <button type="button" className="developer-person" aria-label={`Explore ${user.displayName || user.username}`}
                      aria-pressed={selected.user.username === user.username} onClick={() => selectDeveloper(user.username)}>
                      <Avatar name={user.displayName || user.username} src={user.avatar} />
                      <span className="developer-person-copy">
                        <strong>{user.displayName || user.username}</strong>
                        <span>{user.headline || `@${user.username}`}</span>
                        <span className="developer-person-platforms">{accounts?.filter((account) => account.visibility !== "hidden").map((account) => {
                          const platform = platforms.find((item) => item.id === account.platform);
                          return platform ? <span key={platform.id} title={platform.label}><platform.icon aria-label={platform.label} /></span> : null;
                        })}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="developer-note developer-explorer-list-note">Public work, connected by the developer.</p>
            </aside>
            <section className="surface-card developer-explorer-detail" aria-label="Selected developer">
              <header className="developer-explorer-profile">
                <Avatar name={selected.user.displayName || selected.user.username} src={selected.user.avatar} />
                <div>
                  <p className="feed-eyebrow">@{selected.user.username}</p>
                  <h2>{selected.user.displayName || selected.user.username}</h2>
                  {selected.user.headline && <p>{selected.user.headline}</p>}
                  {selected.user.location && <span className="developer-note">{selected.user.location}</span>}
                </div>
                <Link className="glass-button" to={`/developers/${selected.user.username}`}>Full profile <FiArrowUpRight aria-hidden="true" /></Link>
              </header>
              {selected.user.openToOpportunities && <p className="developer-open">Open to opportunities</p>}
              <div className="developer-skills">
                {selected.topicEvidence?.slice(0, 4).map((item) => <span className="topic-chip" key={item.topic}>#{item.topic} · {item.reputation}</span>)}
                {[...new Set(publicAccounts.flatMap((account) => account.skills || []))].slice(0, 5).map((skill) => <span className="topic-chip" key={skill}>#{skill}</span>)}
              </div>
              <section className="developer-explorer-work" aria-label="Work">
                <div className="developer-section-heading"><div><h3>Work</h3><p>Explore their public platform activity.</p></div></div>
                {publicAccounts.length ? <>
                  <div className="developer-platform-options developer-work-options" role="group" aria-label="View platform work">
                    {publicAccounts.map((account) => <button key={account.platform} type="button" className="glass-button"
                      aria-pressed={activeAccount.platform === account.platform} onClick={() => selectPlatform(account.platform)}>
                      <PlatformIdentity platform={account.platform} />
                    </button>)}
                  </div>
                  <PlatformSummary key={`${selected.user.username}-${activeAccount.platform}`} account={activeAccount} />
                </> : <p className="developer-note">No public connected platforms yet. View the full profile for QnA contributions.</p>}
              </section>
            </section>
          </div>
         ) : <PageState state="empty" title={hasFilters ? "No developers found" : "Make your work discoverable"}>
          <span className="developer-empty-icon"><FiUsers aria-hidden="true" /></span>
          <p>{hasFilters ? "Try another skill, name, or platform to broaden your search." : "Connect your technical profiles and publish your developer profile to appear here."}</p>
          {hasFilters ? <button type="button" className="glass-button" onClick={reset}>Clear filters</button> :
            <Link className="btn-primary" to="/developer-profile">Connect your profiles <FiArrowUpRight aria-hidden="true" /></Link>}
        </PageState>}
      </div>
      {!loading && !error && (data.page > 1 || data.hasMore) && <nav className="developer-pagination" aria-label="Developer pages">
        <button className="glass-button" disabled={data.page <= 1} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.delete("developer"); next.delete("work"); next.set("page", String(data.page - 1)); return next; })}>Previous</button>
        <span>Page {data.page}</span>
        <button className="glass-button" disabled={!data.hasMore} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.delete("developer"); next.delete("work"); next.set("page", String(data.page + 1)); return next; })}>Next</button>
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
