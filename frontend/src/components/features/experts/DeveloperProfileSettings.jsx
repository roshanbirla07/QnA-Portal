import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { apiConnector } from "../../../services/apiConnector";
import { DEVELOPER_PROFILES_ROUTER, PROFILES_ROUTER } from "../../../services/apis";
import PageState from "../../common/PageState";
import Modal from "../../common/Modal";
import PlatformSummary, { platforms, PlatformIdentity } from "./PlatformSummary";

const fields = [
  ["username", "QnA username", 40],
  ["displayName", "Display name", 80],
  ["headline", "Headline", 160],
];
const profileDraft = (user) => ({
  username: user.username || "", displayName: user.displayName || "", headline: user.headline || "",
  candidateProfileVisible: Boolean(user.candidateProfileVisible), openToOpportunities: Boolean(user.openToOpportunities),
});
const DeveloperProfileSettings = () => {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [handles, setHandles] = useState({});
  const [visibility, setVisibility] = useState({});
  const [busy, setBusy] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [leaveTarget, setLeaveTarget] = useState(null);
  const navigate = useNavigate();
  const usernameInput = useRef(null);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    apiConnector("GET", `${DEVELOPER_PROFILES_ROUTER}/me`)
      .then((response) => {
        if (!active) return;
        const next = response.data.data;
        setData(next);
        setDraft(profileDraft(next.user));
        setHandles(Object.fromEntries(next.accounts.map((account) => [account.platform, account.handle])));
        setVisibility(Object.fromEntries(next.accounts.map((account) => [account.platform, account.visibility])));
      })
      .catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [retry]);

  const dirty = Boolean(data && draft && JSON.stringify(draft) !== JSON.stringify(profileDraft(data.user)));
  useEffect(() => {
    if (!dirty) return undefined;
    const beforeUnload = (event) => { event.preventDefault(); event.returnValue = ""; };
    const followLink = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const next = new URL(link.href, window.location.href);
      if (next.origin !== window.location.origin || next.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveTarget(next.pathname + next.search + next.hash);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", followLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", followLink, true);
    };
  }, [dirty]);

  useEffect(() => {
    if (fieldError && !busy) usernameInput.current?.focus();
  }, [fieldError, busy]);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError(""); setFieldError(""); setMessage("");
    if (!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(draft.username.trim().toLowerCase())) {
      setFieldError("Use 3–40 letters, numbers, underscores, or hyphens; start with a letter or number.");
      usernameInput.current?.focus();
      return;
    }
    setBusy("profile");
    try {
      const response = await apiConnector("PATCH", `${PROFILES_ROUTER}/me/profile`, draft);
      const user = response.data.data;
      setData((value) => ({ ...value, user }));
      setDraft(profileDraft(user));
      setMessage("Profile saved.");
    } catch (reason) {
      if (reason.statusCode === 409) {
        setFieldError("That QnA username is already taken. Choose another.");
        usernameInput.current?.focus();
      } else setError(reason.message || "Profile could not be saved. Your changes are still here.");
    } finally { setBusy(""); }
  };

  const updateAccount = (account) => setData((value) => ({
    ...value, accounts: [...value.accounts.filter((item) => item.platform !== account.platform), account],
  }));
  const accountAction = async (platform, operation) => {
    if (busy) return;
    setBusy(platform); setError(""); setMessage("");
    try {
      const url = `${DEVELOPER_PROFILES_ROUTER}/me/accounts/${platform}`;
      if (operation === "remove") {
        await apiConnector("DELETE", url);
        setData((value) => ({ ...value, accounts: value.accounts.filter((item) => item.platform !== platform) }));
        setHandles((value) => ({ ...value, [platform]: "" }));
        setRemoveTarget(null);
        setMessage("Account removed.");
      } else {
        const method = operation === "sync" ? "POST" : operation === "visibility" ? "PATCH" : "PUT";
        const body = operation === "sync" ? null : {
          ...(operation === "save" ? { handle: handles[platform]?.trim() } : {}),
          visibility: visibility[platform] || "public",
        };
        const response = await apiConnector(method, url + (operation === "sync" ? "/sync" : ""), body);
        updateAccount(response.data.data);
        setMessage(response.data.data.verificationStatus === "failed" ? "Account saved, but data sync failed. You can retry Refresh." : "Account updated.");
      }
    } catch (reason) {
      setError(reason.message || "Account could not be updated. Try again.");
      // Sync failure preserves its last successful snapshot; expose the failed state locally too.
      if (operation === "sync") setData((value) => ({
        ...value, accounts: value.accounts.map((item) => item.platform === platform ? { ...item, verificationStatus: "failed" } : item),
      }));
    } finally { setBusy(""); }
  };

  if (loadError) return <main className="developer-page"><PageState state="error" title="Unable to load profile settings">
    <p>Your profile has not been changed.</p><button className="glass-button" onClick={() => setRetry((value) => value + 1)}>Try again</button>
  </PageState></main>;
  if (!data || !draft) return <main className="developer-page"><PageState state="loading" title="Loading profile settings…" /></main>;

  return <main className="developer-page">
    <header className="developer-page-heading"><p className="feed-eyebrow">YOUR DEVELOPER PROFILE</p><h1>Let your work speak</h1>
      <p>Set up your QnA identity, choose what is public, and bring your technical work together.</p></header>
    {error && <p className="developer-form-error" role="alert">{error}</p>}
    {message && <p role="status" className="developer-note">{message}</p>}
    <form noValidate className="surface-card developer-identity-form" onSubmit={saveProfile}>
      <div className="developer-section-heading"><div><h2>Your QnA identity</h2><p>A username gives your published profile its own URL.</p></div></div>
      <div className="developer-identity-fields">
        {fields.map(([name, label, maxLength]) => <div className="developer-search-control" key={name}>
          <label htmlFor={`profile-${name}`}>{label}</label>
          <input id={`profile-${name}`} ref={name === "username" ? usernameInput : undefined}
            className="input-field" maxLength={maxLength} value={draft[name]} disabled={Boolean(busy)}
            aria-invalid={name === "username" && Boolean(fieldError)}
            aria-describedby={name === "username" ? "username-help" : undefined}
            onChange={(event) => { setDraft((value) => ({ ...value, [name]: event.target.value })); if (name === "username") setFieldError(""); }} />
        </div>)}
      </div>
      <p id="username-help" className={fieldError ? "developer-form-error" : "developer-note"}>{fieldError || "3–40 characters. Letters, numbers, underscores, and hyphens. Changing it changes your public profile URL."}</p>
      <div className="developer-preferences">
        <label><input type="checkbox" checked={draft.candidateProfileVisible} disabled={Boolean(busy)}
          onChange={(event) => setDraft((value) => ({ ...value, candidateProfileVisible: event.target.checked }))} />
          <span><strong>Publish my developer profile</strong><small>Make your QnA identity and public connected accounts discoverable. Hidden accounts stay private.</small></span></label>
        <label><input type="checkbox" checked={draft.openToOpportunities} disabled={Boolean(busy)}
          onChange={(event) => setDraft((value) => ({ ...value, openToOpportunities: event.target.checked }))} />
          <span><strong>Open to opportunities</strong><small>Show this on your published developer profile.</small></span></label>
      </div>
      <div className="developer-connect-actions"><button className="btn-primary" disabled={Boolean(busy)} type="submit" aria-busy={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save profile"}</button>
        {data.user.username && data.user.candidateProfileVisible && <Link className="glass-button" to={`/developers/${data.user.username}`}>View public profile <FiArrowUpRight aria-hidden="true" /></Link>}
        {dirty && <span className="developer-note">Unsaved profile changes</span>}
      </div>
      {!data.user.username && <p className="developer-note">Save a QnA username here to finish setting up your directory profile.</p>}
      {!data.user.candidateProfileVisible && <p className="developer-note">Your developer profile is currently unpublished.</p>}
    </form>

    <section className="developer-section">
      <div className="developer-section-heading"><div><h2>Connected platforms</h2><p>Imported data confirms the source, not account ownership. Only the accounts you mark public appear on a published profile.</p></div></div>
      <div className="developer-connect-grid">
        {platforms.map((platform) => {
          const account = data.accounts.find((item) => item.platform === platform.id);
          return <article className="surface-card developer-connect-card" key={platform.id}>
            <PlatformIdentity platform={platform.id} detail />
            <label className="developer-handle-label" htmlFor={`handle-${platform.id}`}>{platform.label} handle</label>
            <input id={`handle-${platform.id}`} className="input-field" value={handles[platform.id] || ""} placeholder={platform.placeholder}
              disabled={Boolean(busy)} onChange={(event) => setHandles((value) => ({ ...value, [platform.id]: event.target.value }))} />
            <label className="developer-account-visibility"><input type="checkbox" checked={(visibility[platform.id] || "public") === "public"} disabled={Boolean(busy)}
              onChange={(event) => setVisibility((value) => ({ ...value, [platform.id]: event.target.checked ? "public" : "hidden" }))} /> Show this account on my published profile</label>
            <div className="developer-connect-actions">
              <button className="btn-primary" disabled={Boolean(busy) || !handles[platform.id]?.trim()} onClick={() => accountAction(platform.id, "save")}>{busy === platform.id ? "Updating…" : account ? "Update account" : "Connect"}</button>
              {account && <button className="glass-button" disabled={Boolean(busy)} onClick={() => accountAction(platform.id, "sync")}><FiRefreshCw aria-hidden="true" /> Refresh</button>}
              {account && <button className="icon-button" disabled={Boolean(busy)} aria-label={`Remove ${platform.label}`} onClick={() => setRemoveTarget(platform)}><FiTrash2 aria-hidden="true" /></button>}
            </div>
            {account && (visibility[platform.id] || "public") !== account.visibility && <button className="glass-button" disabled={Boolean(busy)} onClick={() => accountAction(platform.id, "visibility")}>Save account visibility</button>}
            {account && <><p className="developer-note">Saved visibility: {account.visibility === "hidden" ? "Hidden — visible only to you" : "Public when your QnA profile is published"}</p><PlatformSummary account={account} /></>}
          </article>;
        })}
      </div>
    </section>
    {leaveTarget && <Modal title="Discard unsaved profile changes?" onClose={() => setLeaveTarget(null)}>
      <p>Your identity and publication changes have not been saved.</p>
      <div className="developer-connect-actions"><button className="glass-button" autoFocus onClick={() => setLeaveTarget(null)}>Keep editing</button>
        <button className="glass-button developer-remove" onClick={() => { navigate(leaveTarget); setLeaveTarget(null); }}>Discard changes</button></div>
    </Modal>}
    {removeTarget && <Modal title={`Remove ${removeTarget.label} account?`} onClose={() => { if (!busy) setRemoveTarget(null); }}>
      <p>This removes the linked handle and imported statistics from QnA. Your external account is unaffected.</p>
      {error && <p className="developer-form-error" role="alert">{error}</p>}
      <div className="developer-connect-actions"><button className="glass-button" autoFocus disabled={Boolean(busy)} onClick={() => setRemoveTarget(null)}>Keep account</button>
        <button className="glass-button developer-remove" disabled={Boolean(busy)} onClick={() => accountAction(removeTarget.id, "remove")}>Remove account</button></div>
    </Modal>}
  </main>;
};
export default DeveloperProfileSettings;
