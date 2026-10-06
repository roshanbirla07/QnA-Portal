import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiArrowUpRight, FiSun, FiMoon, FiLogOut, FiMessageSquare } from "react-icons/fi";
import { LOGOUT_USER } from "../../services/apis";
import { useAuth } from "../../contexts/AuthContext";
import { getAuthHeaders } from "../../utils/request";
import SearchField from "../common/SearchField";

const initialTheme = () => {
  try { return localStorage.getItem("theme") === "dark" ? "dark" : "light"; } catch { return "light"; }
};
const Navbar = ({ onMenuToggle, mobileOpen }) => {
  const navigate = useNavigate();
  const { token, logoutUser: clearAuth } = useAuth();
  const [theme, setTheme] = useState(initialTheme);
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch { /* Theme still works when storage is unavailable. */ }
  }, [theme]);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await fetch(LOGOUT_USER, { method: "POST", headers: getAuthHeaders(), credentials: "include" }); }
    catch { /* Clear local credentials even when the server is unavailable. */ }
    finally { clearAuth(); setLoggingOut(false); navigate("/login"); }
  };
  return <header className="portal-header">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="portal-header-inner">
      <button type="button" className="icon-button menu-toggle" aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls={mobileOpen ? "mobile-navigation" : undefined} onClick={onMenuToggle}><FiMenu aria-hidden="true" /></button>
      <Link to="/" className="portal-brand" aria-label="QnA Portal home"><span className="brand-symbol"><FiMessageSquare aria-hidden="true" /></span><span>QnA<span className="brand-muted"> Portal</span></span></Link>
      <form noValidate role="search" className="header-search" onSubmit={(event) => { event.preventDefault(); navigate(search.trim() ? "/search?q=" + encodeURIComponent(search.trim()) : "/search"); }}>
        <SearchField value={search} onChange={setSearch} label="Search questions, topics and jobs" placeholder="Search the community…" />
      </form>
      <div className="header-actions">
        <button type="button" className="icon-button" title={theme === "light" ? "Dark mode" : "Light mode"} aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? <FiMoon aria-hidden="true" /> : <FiSun aria-hidden="true" />}</button>
        {token ? <><Link className="btn-primary header-ask" to="/submitquestion">Ask a question <FiArrowUpRight aria-hidden="true" /></Link>
          <button type="button" className="icon-button" aria-label="Log out" aria-busy={loggingOut} disabled={loggingOut} onClick={logout}><FiLogOut aria-hidden="true" /></button></> :
          <Link className="btn-primary" to="/login">Sign in <FiArrowUpRight aria-hidden="true" /></Link>}
      </div>
    </div>
  </header>;
};
export default Navbar;
