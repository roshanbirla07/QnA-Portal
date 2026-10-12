import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FiArrowUpRight, FiCheckCircle, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiConnector";
import { DEVELOPER_PROFILES_ROUTER, PROFILES_ROUTER } from "../../../services/apis";
import { useAuth } from "../../../contexts/AuthContext";
import "./developer-profiles.css";

const platforms = [
  { id: "github", label: "GitHub", placeholder: "github username", autoSync: true },
  { id: "leetcode", label: "LeetCode", placeholder: "leetcode username", autoSync: false },
  { id: "codeforces", label: "Codeforces", placeholder: "codeforces handle", autoSync: true },
  { id: "medium", label: "Medium", placeholder: "medium username", autoSync: false },
];

const metricText = (account) => {
  const metrics = account?.metrics || {};
  if (account.platform === "github") {
    return [metrics.publicRepos != null && `${metrics.publicRepos} repos`, metrics.totalStars != null && `${metrics.totalStars} stars`].filter(Boolean).join(" · ");
  }
  if (account.platform === "codeforces") {
    return [metrics.rating != null && `rating ${metrics.rating}`, metrics.maxRating != null && `max ${metrics.maxRating}`, metrics.solvedInRecentSubmissions != null && `${metrics.solvedInRecentSubmissions} recent solved`].filter(Boolean).join(" · ");
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
        {account.verificationStatus}
      </span>
    </div>
    <p className="developer-metrics">{metricText(account)}</p>
    {account.skills?.length > 0 && (
      <div className="developer-skills">
        {account.skills.slice(0, 8).map((skill) => <span className="topic-chip" key={skill}>#{skill}</span>)}
      </div>
    )}
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

  const queryKey = params.toString();

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
  }, [queryKey]);

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
        <p className="feed-eyebrow">VERIFIED DEVELOPER EVIDENCE</p>
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

      {loading ? <p role="status">Loading developer profiles…</p> :
        error ? <p role="alert">{error}</p> :
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
        ) : <p>No public developer profiles match these filters.</p>}
    </main>
  );
};

const PublicDeveloperProfile = ({ username }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");
    apiConnector("GET", `${DEVELOPER_PROFILES_ROUTER}/${encodeURIComponent(username)}`)
      .then((response) => { if (active) setData(response.data.data); })
      .catch((reason) => { if (active) setError(reason.message || "Unable to load developer profile"); });
    return () => { active = false; };
  }, [username]);

  if (error) return <main className="developer-page"><p role="alert">{error}</p></main>;
  if (!data) return <main className="developer-page"><p role="status">Loading developer evidence…</p></main>;

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
  const { token } = useAuth();

  const accountMap = useMemo(() => Object.fromEntries((data?.accounts || []).map((account) => [account.platform, account])), [data]);

  const load = () => apiConnector("GET", `${DEVELOPER_PROFILES_ROUTER}/me`)
    .then((response) => {
      const next = response.data.data;
      setData(next);
      setHandles(Object.fromEntries((next.accounts || []).map((account) => [account.platform, account.handle])));
    });

  useEffect(() => {
    if (!token) return undefined;
    load().catch((error) => toast.error(error.message || "Unable to load developer profile"));
  }, [token]);

  const saveAccount = async (platform) => {
    const handle = String(handles[platform] || "").trim();
    if (!handle) return;
    setBusy(platform);
    try {
      await apiConnector("PUT", `${DEVELOPER_PROFILES_ROUTER}/me/accounts/${platform}`, { handle, visibility: "public" });
      await load();
      toast.success(`${platforms.find((item) => item.id === platform)?.label} profile saved`);
    } catch (error) {
      toast.error(error.message || "Unable to save profile");
    } finally { setBusy(""); }
  };

  const syncAccount = async (platform) => {
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
    setBusy(platform);
    try {
      await apiConnector("DELETE", `${DEVELOPER_PROFILES_ROUTER}/me/accounts/${platform}`);
      setHandles((value) => ({ ...value, [platform]: "" }));
      await load();
      toast.success("Profile removed");
    } catch (error) {
      toast.error(error.message || "Unable to remove profile");
    } finally { setBusy(""); }
  };

  const updatePreference = async (key, checked) => {
    try {
      await apiConnector("PATCH", `${PROFILES_ROUTER}/me/profile`, { [key]: checked });
      setData((value) => ({ ...value, user: { ...value.user, [key]: checked } }));
    } catch (error) {
      toast.error(error.message || "Unable to update profile preference");
    }
  };

  if (!data) return <main className="developer-page"><p role="status">Loading profile settings…</p></main>;

  return (
    <main className="developer-page">
      <header className="developer-page-heading">
        <p className="feed-eyebrow">DEVELOPER IDENTITY</p>
        <h1>Connect your technical profiles</h1>
        <p>Build an evidence-backed profile from your public engineering work. You choose whether your profile appears in developer discovery.</p>
      </header>

      <section className="surface-card developer-preferences">
        <label><input type="checkbox" checked={Boolean(data.user.candidateProfileVisible)}
          onChange={(event) => updatePreference("candidateProfileVisible", event.target.checked)} />
          <span><strong>Show me in developer discovery</strong><small>Your public evidence can appear in the Developers directory.</small></span>
        </label>
        <label><input type="checkbox" checked={Boolean(data.user.openToOpportunities)}
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
                {account && <span className={`developer-status developer-status--${account.verificationStatus}`}>{account.verificationStatus}</span>}
              </div>
              <input className="input-field" aria-label={`${platform.label} handle`} placeholder={platform.placeholder}
                value={handles[platform.id] || ""} onChange={(event) => setHandles((value) => ({ ...value, [platform.id]: event.target.value }))} />
              <div className="developer-connect-actions">
                <button className="btn-primary" type="button" disabled={busy === platform.id || !String(handles[platform.id] || "").trim()}
                  onClick={() => saveAccount(platform.id)}>{busy === platform.id ? "Saving…" : account ? "Update" : "Connect"}</button>
                {account && platform.autoSync && <button className="glass-button" type="button" disabled={busy === platform.id} onClick={() => syncAccount(platform.id)}>
                  <FiRefreshCw aria-hidden="true" /> Refresh
                </button>}
                {account && <button className="icon-button" type="button" disabled={busy === platform.id} onClick={() => removeAccount(platform.id)}
                  aria-label={`Remove ${platform.label}`}><FiTrash2 aria-hidden="true" /></button>}
              </div>
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
