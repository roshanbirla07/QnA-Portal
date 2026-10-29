import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams, useLocation } from "react-router-dom";
import { FiArrowUpRight, FiUsers, FiSearch, FiShare2, FiLink } from "react-icons/fi";
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

  useEffect(() => { document.title = "Developers · QnA"; }, []);

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
          <h1>Developers</h1>
          <p>Find people. Explore what they build.</p>
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
          <ul className="developer-people-list" aria-label="Developer profiles">
            {data.items.map(({ user, accounts = [], topicEvidence = [] }) => {
              const publicWork = accounts.filter((account) => account.visibility !== "hidden" && platforms.some((item) => item.id === account.platform));
              const skills = [...new Set(publicWork.flatMap((account) => account.skills || []))].slice(0, 4);
              const name = user.displayName || user.username;
              return <li key={user._id}>
                <Link className="surface-card developer-person" to={`/developers/${user.username}`} state={{ directorySearch: queryKey }} aria-label={`View ${name}'s profile`}>
                  <Avatar userId={user._id} name={name} src={user.avatar} />
                  <div className="developer-person-copy">
                    <h3>{name}</h3>
                    <p className="developer-person-headline">{user.headline || `@${user.username}`}</p>
                    {user.location && <p className="developer-note">{user.location}</p>}
                    {user.bio && <p className="developer-person-bio">{user.bio}</p>}
                    <div className="developer-skills">{skills.map((skill) => <span className="topic-chip" key={skill}>{skill}</span>)}
                      {topicEvidence.slice(0, 2).map((item) => <span className="topic-chip" key={item.topic}>#{item.topic}</span>)}
                    </div>
                    {user.openToOpportunities && <span className="developer-open">Open to opportunities</span>}
                  </div>
                  <div className="developer-person-actions"><span className="developer-view-profile">View profile <FiArrowUpRight aria-hidden="true" /></span>
                    <span className="developer-person-platforms" aria-label="Connected platforms">{platforms.filter((item) => publicWork.some((account) => account.platform === item.id)).map(({ id, icon: Icon, label }) => <span key={id} title={label}><Icon aria-hidden="true" /><span className="sr-only">{label}</span></span>)}</span>
                  </div>
                </Link>
              </li>;
            })}
          </ul>
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
      <p className="developer-directory-note">Only published profiles and public connected platforms appear here.</p>
    </main>
  );
};

const AboutPreview = ({ user, profilePath, navigationState }) => <section className="surface-card developer-profile-about"><h2>About</h2><p>{user.bio || "No introduction shared yet."}</p><Link to={profilePath + "?view=about"} state={navigationState}>More about {user.displayName || user.username} <FiArrowUpRight aria-hidden="true" /></Link></section>;

const profileViews = ["Overview", "Coding", "Projects", "Writing", "About"];
const publicUrl = (value) => {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
};

const PublicDeveloperProfile = ({ username }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [shareState, setShareState] = useState("");
  const [params] = useSearchParams();
  const location = useLocation();
  const heading = useRef(null);
  const shareInput = useRef(null);
  const active = useRef(true);
  const view = profileViews.find((item) => item.toLowerCase() === params.get("view")) || "Overview";
  const profilePath = `/developers/${username}`;
  const directorySearch = typeof location.state?.directorySearch === "string" ? location.state.directorySearch : "";
  const directoryPath = "/developers" + (directorySearch ? `?${new URLSearchParams(directorySearch)}` : "");
  const shareUrl = window.location.origin + profilePath;
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => { if (shareState === "manual") { shareInput.current?.focus(); shareInput.current?.select(); } }, [shareState]);
  useEffect(() => {
    let current = true;
    setError(""); setData(null); setShareState("");
    apiConnector("GET", `${DEVELOPER_PROFILES_ROUTER}/${encodeURIComponent(username)}`)
      .then((response) => { if (current) setData(response.data.data); })
      .catch(() => { if (current) setError("This profile is unavailable or could not be loaded."); });
    return () => { current = false; };
  }, [username, retry]);
  useEffect(() => {
    if (data) { document.title = `${data.user.displayName || data.user.username} · QnA`; heading.current?.focus(); }
    else document.title = error ? "Profile unavailable · QnA" : "Loading profile · QnA";
  }, [data, error]);
  const share = async () => {
    setShareState("pending");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(shareUrl);
      if (active.current) setShareState("copied");
    } catch { if (active.current) setShareState("manual"); }
  };
  if (error) return <main className="developer-page"><Link className="developer-back" to={directoryPath}>← Developers</Link><PageState state="error" title="Profile unavailable"><p>{error}</p><button className="glass-button" onClick={() => setRetry((value) => value + 1)}>Try again</button></PageState></main>;
  if (!data) return <main className="developer-page"><PageState state="loading" title="Loading developer profile…" /></main>;
  const { user, topicEvidence = [] } = data;
  const accounts = (data.accounts || []).filter((account) => account.visibility !== "hidden" && platforms.some((item) => item.id === account.platform));
  const skills = [...new Set(accounts.flatMap((account) => account.skills || []))].slice(0, 6);
  const visibleAccounts = accounts.filter((account) => view === "Overview" || (view === "Coding" && ["leetcode", "codeforces"].includes(account.platform)) || (view === "Projects" && account.platform === "github") || (view === "Writing" && account.platform === "medium"))
    .sort((a, b) => ["leetcode", "codeforces", "github", "medium"].indexOf(a.platform) - ["leetcode", "codeforces", "github", "medium"].indexOf(b.platform));
  const contacts = [["Website", user.website], ["LinkedIn", user.linkedin], ["GitHub", user.github]].map(([label, url]) => ({ label, url: publicUrl(url) })).filter((item) => item.url);
  return <main className="developer-page developer-public-profile">
    <div className="developer-profile-toolbar"><Link className="developer-back" to={directoryPath}>← Developers</Link><span className="developer-note">Public profile</span></div>
    <header className="developer-profile-hero">
      <Avatar userId={user._id} name={user.displayName || user.username} src={user.avatar} />
      <div className="developer-profile-identity"><h1 ref={heading} tabIndex={-1}>{user.displayName || user.username}</h1><p className="developer-note">@{user.username}</p>
        {user.headline && <p>{user.headline}</p>}{user.bio && <p className="developer-profile-intro">{user.bio}</p>}
        <div className="developer-profile-meta">{user.location && <span>{user.location}</span>}{user.openToOpportunities && <span className="developer-open">Open to opportunities</span>}</div>
        <div className="developer-skills">{skills.map((skill) => <span className="topic-chip" key={skill}>{skill}</span>)}</div>
      </div>
      <div className="developer-profile-actions">
        {contacts.length > 0 && <details className="developer-contact"><summary className="glass-button">Contact details</summary><div>{contacts.map((contact) => <a key={contact.label} href={contact.url} target="_blank" rel="noopener noreferrer">{contact.label} <FiArrowUpRight aria-hidden="true" /></a>)}</div></details>}
        <button type="button" className="glass-button" onClick={share} disabled={shareState === "pending"}><FiShare2 aria-hidden="true" />{shareState === "copied" ? "Link copied" : "Share profile"}</button>
        {shareState === "copied" && <span className="sr-only" role="status">Profile link copied.</span>}
        {shareState === "manual" && <label className="developer-share-fallback">Copy this profile link<input ref={shareInput} className="input-field" readOnly value={shareUrl} /></label>}
      </div>
    </header>
    {accounts.length > 0 && <nav className="developer-profile-links" aria-label="Connected platforms">{platforms.filter((item) => accounts.some((account) => account.platform === item.id)).map((item) => {
      const account = accounts.find((entry) => entry.platform === item.id), url = publicUrl(account.profileUrl);
      return url ? <a key={item.id} href={url} target="_blank" rel="noopener noreferrer"><PlatformIdentity platform={item.id} /></a> : <span key={item.id}><PlatformIdentity platform={item.id} /></span>;
    })}</nav>}
    <nav className="developer-profile-tabs" aria-label="Profile sections">{profileViews.map((item) => <Link key={item} to={profilePath + (item === "Overview" ? "" : `?view=${item.toLowerCase()}`)} state={location.state} aria-current={view === item ? "page" : undefined}>{item}</Link>)}</nav>
    {view !== "About" && <section className="developer-profile-content" aria-label={`${view} details`}>
      {visibleAccounts.length ? <div className="developer-evidence-grid">{visibleAccounts.map((account) => <PlatformSummary key={account.platform} account={account} />)}
        {view === "Overview" && <AboutPreview user={user} profilePath={profilePath} navigationState={location.state} />}
      </div> : <PageState state="empty" title={view === "Overview" ? "No public connected platforms yet" : `No public ${view.toLowerCase()} to show`}><p>This developer has not shared {view === "Overview" ? "external platform activity" : `any ${view.toLowerCase()} activity`}.</p></PageState>}
    </section>}
    {view === "Overview" && !visibleAccounts.length && <AboutPreview user={user} profilePath={profilePath} navigationState={location.state} />}
    {view === "About" && <>
      <section className="surface-card developer-section"><h2>About</h2><p>{user.bio || "No introduction shared yet."}</p>
        {contacts.length > 0 && <ul className="developer-public-contacts">{contacts.map((contact) => <li key={contact.label}><a href={contact.url} target="_blank" rel="noopener noreferrer"><FiLink aria-hidden="true" />{contact.label}</a></li>)}</ul>}
      </section>
      <section className="surface-card developer-section"><h2>QnA topic evidence</h2><p className="developer-note">Topic reputation is earned from contributions on QnA Portal.</p><div className="developer-skills">{topicEvidence.length ? topicEvidence.map((item) => <Link className="topic-chip" to={`/topics/${item.topic}`} key={item.topic}>#{item.topic} · {item.reputation}</Link>) : <span>No topic reputation yet.</span>}</div></section>
    </>}
  </main>;
};

const DeveloperProfilesPage = ({ manage = false }) => {
  const { username } = useParams();
  if (manage) return <DeveloperProfileSettings />;
  if (username) return <PublicDeveloperProfile key={username} username={username} />;
  return <DeveloperDirectory />;
};

export default DeveloperProfilesPage;
