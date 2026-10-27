import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../../../contexts/AuthContext";
import { apiConnector } from "../../../services/apiConnector";
import { LOGIN_USER, SIGNUP_USER, GOOGLE_LOGIN } from "../../../services/apis";
import GoogleSignIn from "./GoogleSignIn";
import "./auth.css";

const AuthPage = ({ signup = false }) => {
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
  const [linkCredential, setLinkCredential] = useState("");
  const emailInput = useRef(null), passwordInput = useRef(null);
  useEffect(() => { if (linkCredential) passwordInput.current?.focus(); }, [linkCredential]);
  const finish = (response) => {
    if (!active.current) return;
    const token = response.data?.data?.token;
    if (!response.data?.success || !token) throw new Error("Sign-in could not finish. Please try again.");
    setLinkCredential("");
    setPassword("");
    setToken(token);
    const from = location.state?.from;
    navigate(from?.pathname?.startsWith("/") && !from.pathname.startsWith("//") ? from.pathname + (from.search || "") + (from.hash || "") : "/", { replace: true });
  };
  const signInWithGoogle = async (credential) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setInvalid("");
    try { finish(await apiConnector("POST", GOOGLE_LOGIN, { credential })); }
    catch (reason) {
      if (!active.current) return;
      if (reason.response?.data?.code === "GOOGLE_LINK_REQUIRED") {
        setLinkCredential(credential); setPassword(""); setShowPassword(false);
      } else { setError("Google sign-in could not finish. Please try again."); throw reason; }
    } finally { busyRef.current = false; if (active.current) setBusy(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (busyRef.current) return;
    setError(""); setInvalid("");
    if (!linkCredential && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setInvalid("email"); setError("Enter a valid email address."); emailInput.current?.focus(); return;
    }
    if (!password) { setInvalid("password"); setError("Enter your password."); passwordInput.current?.focus(); return; }
    busyRef.current = true; setBusy(true);
    try {
      finish(await apiConnector("POST", linkCredential ? GOOGLE_LOGIN : signup ? SIGNUP_USER : LOGIN_USER,
        linkCredential ? { credential: linkCredential, password } : { email: email.trim(), password }));
    } catch (reason) {
      if (!active.current) return;
      if (linkCredential && reason.response?.data?.code !== "GOOGLE_PASSWORD_INVALID") {
        setLinkCredential(""); setError("Start Google sign-in again to link your account.");
      } else setError(linkCredential ? "The password could not be verified. Try again." : reason.statusCode >= 500 || !reason.statusCode
        ? "Unable to reach sign-in. Please try again." : signup && reason.statusCode === 409 ? "An account already uses this email. Sign in instead." : signup ? "Your account could not be created. Check your details and try again." : "Email or password is incorrect.");
      setPassword(""); setShowPassword(false); passwordInput.current?.focus();
    } finally { busyRef.current = false; if (active.current) setBusy(false); }
  };
  return <main className="auth-page"><section className="surface-card auth-card">
    <p className="auth-eyebrow">QnA Portal</p><h1>{linkCredential ? "Link your Google account" : signup ? "Create your account" : "Welcome back"}</h1>
    <p className="auth-description">{linkCredential ? "Confirm your existing QnA password to securely connect this Google account." : "Join the conversations and bring your work together."}</p>
    {!linkCredential && <><GoogleSignIn onCredential={signInWithGoogle} disabled={busy} /><div className="auth-divider"><span>or use email</span></div></>}
    <form noValidate onSubmit={submit} aria-busy={busy}>
      {!linkCredential && <div className="auth-field"><label htmlFor="auth-email">Email</label><input ref={emailInput} id="auth-email" name="email" type="email" autoComplete="email" className="input-field" value={email} disabled={busy}
        aria-invalid={invalid === "email"} aria-describedby={error ? "auth-error" : undefined} onChange={(event) => { setEmail(event.target.value); setInvalid(""); }} /></div>}
      <div className="auth-field"><label htmlFor="auth-password">{linkCredential ? "Existing QnA password" : "Password"}</label><div className="auth-password"><input ref={passwordInput} id="auth-password" name="password" type={showPassword ? "text" : "password"}
        autoComplete={signup && !linkCredential ? "new-password" : "current-password"} className="input-field" value={password} disabled={busy} aria-invalid={invalid === "password"} aria-describedby={error ? "auth-error" : undefined}
        onChange={(event) => { setPassword(event.target.value); setInvalid(""); }} /><button type="button" className="icon-button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} disabled={busy} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button></div></div>
      {error && <p id="auth-error" className="auth-error" role="alert">{error}</p>}
      <button className="btn-primary auth-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : linkCredential ? "Confirm and link Google" : signup ? "Create account" : "Sign in"}</button>
      {linkCredential && <button type="button" className="glass-button auth-submit" disabled={busy} onClick={() => { setLinkCredential(""); setPassword(""); setShowPassword(false); setError(""); }}>Cancel linking</button>}
    </form>
    {!linkCredential && <p className="auth-switch">{signup ? "Already have an account? " : "New to QnA Portal? "}<Link to={signup ? "/login" : "/signup"} state={location.state}>{signup ? "Sign in" : "Create an account"}</Link></p>}
  </section></main>;
};
export default AuthPage;
