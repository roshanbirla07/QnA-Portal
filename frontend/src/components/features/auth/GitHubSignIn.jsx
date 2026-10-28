import React, { useEffect, useState } from "react";
import { SiGithub } from "react-icons/si";
import { apiConnector } from "../../../services/apiConnector";
import { AUTH_CONFIG } from "../../../services/apis";

const GitHubSignIn = ({ onStart, disabled }) => {
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState("loading");
    apiConnector("GET", AUTH_CONFIG).then((response) => {
      if (active) setState(response.data.data.githubEnabled ? "ready" : "unavailable");
    }).catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [attempt]);
  return <section className="auth-provider" aria-label="GitHub sign-in">
    {state === "loading" && <p role="status">Loading GitHub sign-in…</p>}
    {state === "ready" && <button type="button" className="glass-button auth-provider-button" disabled={disabled} onClick={onStart}><SiGithub aria-hidden="true" />Continue with GitHub</button>}
    {state === "unavailable" && <p>GitHub sign-in is unavailable. You can use email and password.</p>}
    {state === "error" && <><p role="alert">Could not load GitHub sign-in. Please try again.</p><button type="button" className="glass-button" disabled={disabled} onClick={() => setAttempt((value) => value + 1)}>Retry GitHub sign-in</button></>}
  </section>;
};
export default GitHubSignIn;
