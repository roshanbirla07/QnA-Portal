import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FiArrowUpRight, FiCheckCircle, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiConnector";
import { DEVELOPER_PROFILES_ROUTER, PROFILES_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";
import PageState from "../../common/PageState";
import "./developer-profiles.css";

const platforms = [
  { id: "github", label: "GitHub", placeholder: "github username", autoSync: true },
  { id: "leetcode", label: "LeetCode", placeholder: "leetcode username", autoSync: true },
  { id: "codeforces", label: "Codeforces", placeholder: "codeforces handle", autoSync: true },
  { id: "medium", label: "Medium", placeholder: "medium username", autoSync: true },
];

const metricText = (account) => {
  const metrics = account?.metrics || {};
  if (account.platform === "github") {
    return [metrics.publicRepos != null && `${metrics.publicRepos} repos`, metrics.totalStars != null && `${metrics.totalStars} stars`].filter(Boolean).join(" · ");
  }
  if (account.platform === "codeforces") {
    return [metrics.rating != null && `rating ${metrics.rating}`, metrics.maxRating != null && `max ${metrics.maxRating}`, metrics.solvedInRecentSubmissions != null && `${metrics.solvedInRecentSubmissions} recent solved`].filter(Boolean).join(" · ");
  }
  if (account.platform === "leetcode") {
    return [metrics.solvedTotal != null && `${metrics.solvedTotal} solved`, metrics.contestRating != null && `contest ${Math.round(metrics.contestRating)}`, metrics.profileRanking != null && `rank ${metrics.profileRanking}`].filter(Boolean).join(" · ") || "LeetCode profile";
  }
  if (account.platform === "medium") {
    return metrics.recentArticlesCount != null ? `${metrics.recentArticlesCount} recent RSS articles` : "Medium profile";
  }
  return "Profile link";
};

const EvidenceCard = ({ account }) => (
  <article className="developer-evidence-card">
    <div className="developer-evidence-heading">
      <div>
        <p className="developer-platform">{account.platform}</p>
        <a href={account.profileUrl} target="_blank" rel="noopener noreferrer">
          {account.handle} <FiArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <span className={`developer-status developer-status--${account.verificationStatus}`}>
        {account.verificationStatus === "verified" && <FiCheckCircle aria-hidden="true" />}
        {account.verificationStatus === "verified" ? "Data synced" : account.verificationStatus}
      </span>
    </div>
    <p className="developer-metrics">{metricText(account)}</p>
    {account.skills?.length > 0 && (
      <div className="developer-skills">
        {account.skills.slice(0, 8).map((skill) => <span className="topic-chip" key={skill}>#{skill}</span>)}
      </div>
    )}
    {account.metrics?.recentArticles?.length > 0 && <ul className="developer-article-list">{account.metrics.recentArticles.slice(0, 5).map((article) => <li key={article.url}><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a></li>)}</ul>}
    {account.verificationNote && <p className="developer-note">{account.verificationNote}</p>}
  </article>
);

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
  const page = Math.max(1, Number(params.get("page")) || 1);

  useEffect(() => {
    setDraft({ q: params.get("q") || "", skill: params.get("skill") || "", platform: params.get("platform") || "" });
  }, [queryKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const requestParams = Object.fromEntries(new URLSearchParams(queryKey).entries());
    apiConnector("GET", DEVELOPER_PROFILES_ROUTER, null, null, requestParams)
      .then((response) => { if (active) setData(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message || "Unable to load developer profiles"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [queryKey, retry]);

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
      <header className="developer-page-heading">
        <p className="feed-eyebrow">DEVELOPER EVIDENCE</p>
        <h1>Discover developers by demonstrated work</h1>
        <p>Explore public technical profiles and QnA topic reputation. Evidence is shown directly; QnA does not generate a hiring score.</p>
      </header>

      <form className="developer-filter surface-card" noValidate onSubmit={submit}>
        <input className="input-field" aria-label="Search developers" placeholder="Name, headline, location" value={draft.q}
          onChange={(event) => setDraft((value) => ({ ...value, q: event.target.value }))} />
        <input className="input-field" aria-label="Skill" placeholder="Skill, e.g. kafka" value={draft.skill}
          onChange={(event) => setDraft((value) => ({ ...value, skill: event.target.value }))} />
        <select className="input-field" aria-label="Platform" value={draft.platform}
          onChange={(event) => setDraft((value) => ({ ...value, platform: event.target.value }))}>
          <option value="">Any platform</option>
          {platforms.map((platform) => <option value={platform.id} key={platform.id}>{platform.label}</option>)}
        </select>
        <button className="btn-primary" type="submit">Filter developers</button>
      </form>

      {!loading && !error && <p className="developer-result-count" role="status">{data.total || 0} public developer profiles</p>}
      {loading ? <PageState state="loading" title="Loading developer profiles…" /> :
        error ? <PageState state="error" title="Could not load developers"><button type="button" className="glass-button" onClick={() => setRetry((value) => value + 1)}>Try again</button></PageState> :
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
                  {accounts?.flatMap((account) => account.skills || []).filter((skill, index, all) => all.indexOf(skill) === index)
                    .slice(0, 5).map((skill) => <span className="topic-chip" key={skill}>#{skill}</span>)}
                </div>
                <p className="developer-platform-line">{accounts?.map((account) => account.platform).join(" · ") || "QnA evidence only"}</p>
                <Link className="glass-button" to={`/developers/${user.username}`}>View evidence</Link>
              </article>
            ))}
          </section>
        ) : <PageState state="empty" title="No developers found">Try a different skill or clear your filters.</PageState>}
      {!loading && !error && data.total > (data.limit || 20) && <nav className="developer-pagination" aria-label="Developer result pages">
        <button className="glass-button" disabled={page <= 1} onClick={() => { const p = new URLSearchParams(queryKey); p.set("page", String(page - 1)); setParams(p); }}>Previous</button>
        <span>Page {page} of {Math.ceil(data.total / (data.limit || 20))}</span>
        <button className="glass-button" disabled={!data.hasMore} onClick={() => { const p = new URLSearchParams(queryKey); p.set("page", String(page + 1)); setParams(p); }}>Next</button>
      </nav>}
    </main>
  );
};

const PublicDeveloperProfile = ({ username }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    apiConnector("GET", `${DEVELOPER_PROFILES_ROUTER}/${encodeURIComponent(username)}`)
      .then((response) => { if (active) setData(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message || "Unable to load developer profile"); });
    return () => { active = false; };
  }, [username]);

  if (error) return <main className="developer-page"><PageState state="error" title="Developer profile unavailable">{error}</PageState></main>;
  if (!data) return <main className="developer-page"><PageState state="loading" title="Loading developer evidence…" /></main>;

  const { user, accounts, topicEvidence } = data;
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
        <div className="developer-section-heading"><div><h2>External evidence</h2><p>Public profiles linked by this developer.</p></div></div>
        {accounts.length ? <div className="developer-evidence-grid">{accounts.map((account) => <EvidenceCard key={account.platform} account={account} />)}</div> :
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

const ManageDeveloperProfile = () => {
  const [data, setData] = useState(null);
  const [handles, setHandles] = useState({});
  const [busy, setBusy] = useState("");
  const [visibility, setVisibility] = useState({});
  const [confirmRemove, setConfirmRemove] = useState("");
  const [loadError, setLoadError] = useState("");
  const [preferencesBusy, setPreferencesBusy] = useState(false);
  const { token } = useAuth();

  const accountMap = useMemo(() => Object.fromEntries((data?.accounts || []).map((account) => [account.platform, account])), [data]);

  const load = () => apiConnector("GET", `${DEVELOPER_PROFILES_ROUTER}/me`)
    .then((response) => {
      const next = response.data.data;
      setData(next);
      setHandles(Object.fromEntries((next.accounts || []).map((account) => [account.platform, account.handle])));
      setVisibility(Object.fromEntries((next.accounts || []).map((account) => [account.platform, account.visibility])));
      setLoadError("");
    });

  useEffect(() => {
    if (!token) return undefined;
    load().catch(() => setLoadError("Unable to load your developer profile. Check your connection and retry."));
  }, [token]);

  const saveAccount = async (platform) => {
    const handle = String(handles[platform] || "").trim();
    if (!handle) return;
    if (busy) return;
    setBusy(platform);
    try {
      await apiConnector("PUT", `${DEVELOPER_PROFILES_ROUTER}/me/accounts/${platform}`, { handle, visibility: visibility[platform] || "hidden" });
      await load();
      toast.success(`${platforms.find((item) => item.id === platform)?.label} profile saved`);
    } catch (error) {
      toast.error(error.message || "Unable to save profile");
    } finally { setBusy(""); }
  };

  const syncAccount = async (platform) => {
    if (busy) return;
    setBusy(platform);
    try {
      await apiConnector("POST", `${DEVELOPER_PROFILES_ROUTER}/me/accounts/${platform}/sync`);
      await load();
      toast.success("Profile evidence refreshed");
    } catch (error) {
      await load().catch(() => {});
      toast.error(error.message || "Unable to sync profile");
    } finally { setBusy(""); }
  };

  const removeAccount = async (platform) => {
    if (busy) return;
    setBusy(platform);
    try {
      await apiConnector("DELETE", `${DEVELOPER_PROFILES_ROUTER}/me/accounts/${platform}`);
      setHandles((value) => ({ ...value, [platform]: "" }));
      await load();
      setConfirmRemove("");
      toast.success("Profile removed");
    } catch (error) {
      toast.error(error.message || "Unable to remove profile");
    } finally { setBusy(""); }
  };

  const updatePreference = async (key, checked) => {
    if (preferencesBusy) return;
    setPreferencesBusy(true);
    try {
      await apiConnector("PATCH", `${PROFILES_ROUTER}/me/profile`, { [key]: checked });
      setData((value) => ({ ...value, user: { ...value.user, [key]: checked } }));
    } catch (error) {
      toast.error(error.message || "Unable to update profile preference");
    } finally { setPreferencesBusy(false); }
  };

  if (loadError) return <main className="developer-page"><PageState state="error" title="Profile settings unavailable"><p>{loadError}</p><button className="glass-button" onClick={() => load().catch(() => {})}>Retry</button></PageState></main>;
  if (!data) return <main className="developer-page"><PageState state="loading" title="Loading profile settings…" /></main>;

  return (
    <main className="developer-page">
      <header className="developer-page-heading">
        <p className="feed-eyebrow">DEVELOPER IDENTITY</p>
        <h1>Connect your technical profiles</h1>
        <p>Build an evidence-backed profile from your public engineering work. You choose whether your profile appears in developer discovery.</p>
      </header>

      <section className="surface-card developer-preferences">
        <label><input type="checkbox" disabled={preferencesBusy} checked={Boolean(data.user.candidateProfileVisible)}
          onChange={(event) => updatePreference("candidateProfileVisible", event.target.checked)} />
          <span><strong>Publish my developer profile</strong><small>Your public evidence can appear in the Developers directory and on your public developer URL.</small></span>
        </label>
        <label><input type="checkbox" disabled={preferencesBusy} checked={Boolean(data.user.openToOpportunities)}
          onChange={(event) => updatePreference("openToOpportunities", event.target.checked)} />
          <span><strong>Open to opportunities</strong><small>Display this signal on your public developer profile.</small></span>
        </label>
        {data.user.username && <Link className="glass-button" to={`/developers/${data.user.username}`}>View public profile</Link>}
        {!data.user.username && <p className="developer-note">Set a username in your profile before sharing a public developer URL.</p>}
      </section>

      <section className="developer-connect-grid">
        {platforms.map((platform) => {
          const account = accountMap[platform.id];
          return (
            <article className="surface-card developer-connect-card" key={platform.id}>
              <div className="developer-evidence-heading">
                <div><p className="developer-platform">{platform.label}</p><h2>{account ? account.handle : "Not connected"}</h2></div>
                {account && <span className={`developer-status developer-status--${account.verificationStatus}`}>{account.verificationStatus === "verified" ? "Data synced" : account.verificationStatus}</span>}
              </div>
              <input className="input-field" aria-label={`${platform.label} handle`} placeholder={platform.placeholder}
                value={handles[platform.id] || ""} onChange={(event) => setHandles((value) => ({ ...value, [platform.id]: event.target.value }))} />
              <label className="developer-visibility-label" htmlFor={`visibility-${platform.id}`}>Visibility</label>
              <select className="input-field developer-visibility" id={`visibility-${platform.id}`} disabled={Boolean(busy)} value={visibility[platform.id] || "hidden"} onChange={(event) => setVisibility((value) => ({ ...value, [platform.id]: event.target.value }))}>
                <option value="hidden">Private — only you</option><option value="public">Public on your profile</option>
              </select>
              <div className="developer-connect-actions">
                <button className="btn-primary" type="button" disabled={Boolean(busy) || !String(handles[platform.id] || "").trim()}
                  onClick={() => saveAccount(platform.id)}>{busy === platform.id ? "Saving…" : account ? "Update" : "Connect"}</button>
                {account && platform.autoSync && <button className="glass-button" type="button" disabled={Boolean(busy)} onClick={() => syncAccount(platform.id)}>
                  <FiRefreshCw aria-hidden="true" /> Refresh
                </button>}
                {account && <button className="icon-button" type="button" disabled={Boolean(busy)} onClick={() => setConfirmRemove(platform.id)}
                  aria-label={`Remove ${platform.label}`}><FiTrash2 aria-hidden="true" /></button>}
              </div>
              {confirmRemove === platform.id && <div className="developer-remove-confirm" role="group" aria-label={`Remove ${platform.label} confirmation`}><p>Remove this linked profile and its imported evidence?</p><button type="button" className="glass-button" onClick={() => setConfirmRemove("")}>Keep profile</button><button type="button" className="glass-button developer-danger" onClick={() => removeAccount(platform.id)}>Remove profile</button></div>}
              {account && <><p className="developer-metrics">{metricText(account)}</p><p className="developer-note">{account.verificationNote}</p></>}
              {!platform.autoSync && <p className="developer-note">This platform currently stores a public profile link only; QnA does not claim automated verification.</p>}
            </article>
          );
        })}
      </section>
    </main>
  );
};

const DeveloperProfilesPage = ({ manage = false }) => {
  const { username } = useParams();
  if (manage) return <ManageDeveloperProfile />;
  if (username) return <PublicDeveloperProfile username={username} />;
  return <DeveloperDirectory />;
};

export default DeveloperProfilesPage;
