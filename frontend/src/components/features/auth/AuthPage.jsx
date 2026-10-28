import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../../../contexts/AuthContext";
import { apiConnector } from "../../../services/apiConnector";
import { LOGIN_USER, SIGNUP_USER, GITHUB_LINK, GITHUB_START, GITHUB_CANCEL } from "../../../services/apis";
import GitHubSignIn from "./GitHubSignIn";
import GitHubCallback from "./GitHubCallback";
import "./auth.css";

const AuthPage = ({ signup = false, githubCallback = false }) => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState("");
  const [linking, setLinking] = useState(false);
  const [callbackPending, setCallbackPending] = useState(githubCallback);
  const emailInput = useRef(null), passwordInput = useRef(null);
  useEffect(() => { if (linking) passwordInput.current?.focus(); }, [linking]);
  const finish = (response) => {
    if (!active.current) return;
    const token = response.data?.data?.token;
    if (!response.data?.success || !token) throw new Error("Sign-in could not finish. Please try again.");
    setLinking(false);
    setPassword("");
    setToken(token);
    const from = response.data.data.returnTo ? { pathname: response.data.data.returnTo } : location.state?.from;
    navigate(from?.pathname?.startsWith("/") && !from.pathname.startsWith("//") ? from.pathname + (from.search || "") + (from.hash || "") : "/", { replace: true });
  };
  const startGitHub = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const from = location.state?.from;
      const response = await apiConnector("POST", GITHUB_START, { returnTo: from ? from.pathname + (from.search || "") + (from.hash || "") : "/" });
      if (!active.current) return;
      const url = new URL(response.data.data.authorizeUrl);
      if (url.origin !== "https://github.com" || url.pathname !== "/login/oauth/authorize") throw new Error("Invalid provider URL");
      window.location.assign(url.toString());
    } catch { if (active.current) setError("GitHub sign-in could not start. Please try again."); }
    finally { busyRef.current = false; if (active.current) setBusy(false); }
  };
  const cancelLink = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      await apiConnector("POST", GITHUB_CANCEL, {});
      if (active.current) { setLinking(false); setPassword(""); setShowPassword(false); setError(""); }
    } catch { if (active.current) setError("Could not cancel linking. Please try again."); }
    finally { busyRef.current = false; if (active.current) setBusy(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busyRef.current) return;
    setError(""); setInvalid("");
    if (!linking && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setInvalid("email"); setError("Enter a valid email address."); emailInput.current?.focus(); return;
    }
    if (!password) { setInvalid("password"); setError("Enter your password."); passwordInput.current?.focus(); return; }
    busyRef.current = true; setBusy(true);
    try {
      finish(await apiConnector("POST", linking ? GITHUB_LINK : signup ? SIGNUP_USER : LOGIN_USER,
        linking ? { password } : { email: email.trim(), password }));
    } catch (reason) {
      if (!active.current) return;
      if (linking && reason.response?.data?.code !== "GITHUB_PASSWORD_INVALID") {
        setLinking(false); setError("Start GitHub sign-in again to link your account.");
      } else setError(linking ? "The password could not be verified. Try again." : reason.statusCode >= 500 || !reason.statusCode
        ? "Unable to reach sign-in. Please try again." : signup && reason.statusCode === 409 ? "An account already uses this email. Sign in instead." : signup ? "Your account could not be created. Check your details and try again." : "Email or password is incorrect.");
      setPassword(""); setShowPassword(false); passwordInput.current?.focus();
    } finally { busyRef.current = false; if (active.current) setBusy(false); }
  };
  return <main className="auth-page"><section className="surface-card auth-card">
    <p className="auth-eyebrow">QnA Portal</p><h1>{linking ? "Link your GitHub account" : signup ? "Create your account" : "Welcome back"}</h1>
    <p className="auth-description">{linking ? "Confirm your existing QnA password to securely connect this GitHub account." : "Join the conversations and bring your work together."}</p>
    {callbackPending && <GitHubCallback onSuccess={(response) => { setCallbackPending(false); finish(response); }} onLink={() => { setCallbackPending(false); setLinking(true); }} onError={(message) => { setCallbackPending(false); setError(message); }} />}
    {!callbackPending && !linking && <><GitHubSignIn onStart={startGitHub} disabled={busy} /><div className="auth-divider"><span>or use email</span></div></>}
    {!callbackPending && <form noValidate onSubmit={submit} aria-busy={busy}>
      {!linking && <div className="auth-field"><label htmlFor="auth-email">Email</label><input ref={emailInput} id="auth-email" name="email" type="email" autoComplete="email" className="input-field" value={email} disabled={busy}
        aria-invalid={invalid === "email"} aria-describedby={error ? "auth-error" : undefined} onChange={(event) => { setEmail(event.target.value); setInvalid(""); }} /></div>}
      <div className="auth-field"><label htmlFor="auth-password">{linking ? "Existing QnA password" : "Password"}</label><div className="auth-password"><input ref={passwordInput} id="auth-password" name="password" type={showPassword ? "text" : "password"}
        autoComplete={signup && !linking ? "new-password" : "current-password"} className="input-field" value={password} disabled={busy} aria-invalid={invalid === "password"} aria-describedby={error ? "auth-error" : undefined}
        onChange={(event) => { setPassword(event.target.value); setInvalid(""); }} /><button type="button" className="icon-button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} disabled={busy} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button></div></div>
      {error && <p id="auth-error" className="auth-error" role="alert">{error}</p>}
      <button className="btn-primary auth-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : linking ? "Confirm and link GitHub" : signup ? "Create account" : "Sign in"}</button>
      {linking && <button type="button" className="glass-button auth-submit" disabled={busy} onClick={cancelLink}>Cancel linking</button>}
    </form>}
    {!callbackPending && !linking && <p className="auth-switch">{signup ? "Already have an account? " : "New to QnA Portal? "}<Link to={signup ? "/login" : "/signup"} state={location.state}>{signup ? "Sign in" : "Create an account"}</Link></p>}
  </section></main>;
};
export default AuthPage;
