import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiPlus, FiSun, FiMoon, FiLogOut } from "react-icons/fi";
import { LOGOUT_USER } from "../../services/apis";
import { useAuth } from "../../contexts/AuthContext";
import { getAuthHeaders } from "../../utils/request";
import QuestionForm from "../features/questions/QuestionForm";

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { token, logoutUser: clearAuth } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [newPostPopup, setNewPostPopup] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  const logout = async () => {
    try { await fetch(LOGOUT_USER, { method: "POST", headers: getAuthHeaders(), credentials: "include" }); }
    catch (error) { /* Local credentials must still be cleared if the server is unavailable. */ }
    finally { clearAuth(); navigate("/login"); }
  };

  return <>
    <header className="sticky top-0 z-50 h-16 border-b bg-bg-card backdrop-blur-md" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" className="icon-button lg:hidden" aria-label="Open menu" onClick={onMenuToggle}><FiMenu /></button>
        <Link to="/" className="shrink-0 text-xl font-bold tracking-tight text-text-primary">QnA<span className="text-primary-blue"> Portal</span></Link>
        <form onSubmit={(event) => { event.preventDefault(); navigate(search.trim() ? `/?search=${encodeURIComponent(search.trim())}` : "/"); }}
          className="relative ml-auto hidden w-full max-w-md md:block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="search" aria-label="Search questions" placeholder="Search questions, topics and jobs" className="input-field w-full pl-10 py-2"
            value={search} onChange={(event) => setSearch(event.target.value)} />
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <button type="button" className="icon-button" aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? <FiMoon /> : <FiSun />}
          </button>
          {token ? <>
            <button type="button" className="btn-primary hidden items-center gap-2 sm:inline-flex" onClick={() => setNewPostPopup(true)}><FiPlus /> Ask</button>
            <button type="button" className="icon-button" aria-label="Log out" onClick={logout}><FiLogOut /></button>
          </> : <Link className="btn-primary" to="/login">Sign in</Link>}
        </div>
      </div>
    </header>
    {token && <button type="button" aria-label="Ask a question" onClick={() => setNewPostPopup(true)}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-blue text-white shadow-lg sm:hidden"><FiPlus /></button>}
    {token && newPostPopup && <QuestionForm setNewPostPopup={setNewPostPopup} newPostPopup={newPostPopup} />}
  </>;
};

export default Navbar;
