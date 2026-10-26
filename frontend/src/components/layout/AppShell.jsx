import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FiHome, FiSearch, FiUsers, FiBriefcase, FiGrid, FiDollarSign, FiMessageCircle, FiStar, FiGitBranch, FiAward, FiUserPlus, FiSend, FiCompass, FiUser, FiChevronDown } from "react-icons/fi";
import { apiConnector } from "../../services/apiConnector";
import { TOPICS_ROUTER } from "../../services/apis";
import Modal from "../common/Modal";

const sections = [
  { title: "Discover", links: [["Home", "/", FiHome], ["Search", "/search", FiSearch], ["Experts", "/experts", FiUsers], ["Developers", "/developers", FiUser]] },
  { title: "Career", links: [["Jobs", "/jobs", FiBriefcase], ["Companies", "/companies", FiGrid], ["Salaries", "/salaries", FiDollarSign], ["Interviews", "/interviews", FiMessageCircle], ["Reviews", "/reviews", FiStar]] },
  { title: "Community", links: [["Communities", "/communities", FiCompass], ["Projects", "/projects", FiGitBranch], ["Rankings", "/rankings", FiAward], ["Connections", "/connections", FiUserPlus], ["Developer profile", "/developer-profile", FiUser], ["Referrals", "/referrals", FiSend]] },
];
const primaryLabels = ["Home", "Developers", "Projects", "Jobs", "Companies", "Communities", "Rankings"];
const primaryLinks = primaryLabels.map((label) => sections.flatMap((section) => section.links).find(([name]) => name === label));

const AppShell = ({ children, mobileOpen, closeMobile }) => {
  const [topics, setTopics] = useState([]);
  const moreRef = useRef(null);
  const location = useLocation();
  useEffect(() => { if (moreRef.current) moreRef.current.open = false; }, [location.pathname, location.search]);
  useEffect(() => {
    const dismissMore = (event) => {
      if (!moreRef.current?.open) return;
      if (event.type === "keydown" && event.key === "Escape") {
        moreRef.current.open = false;
        moreRef.current.querySelector("summary").focus();
      } else if (event.type === "pointerdown" && !moreRef.current.contains(event.target)) {
        moreRef.current.open = false;
      }
    };
    document.addEventListener("keydown", dismissMore);
    document.addEventListener("pointerdown", dismissMore);
    return () => {
      document.removeEventListener("keydown", dismissMore);
      document.removeEventListener("pointerdown", dismissMore);
    };
  }, []);
  useEffect(() => {
    let active = true;
    apiConnector("GET", TOPICS_ROUTER, null, null, { limit: 6 })
      .then((response) => { if (active) setTopics(Array.isArray(response.data.data) ? response.data.data : []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024 && mobileOpen) closeMobile();
      if (window.innerWidth < 1024 && moreRef.current) moreRef.current.open = false;
    };
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, [mobileOpen, closeMobile]);
  const sidebar = <div className="sidebar-content">
    {sections.map((section) => <section className="sidebar-section" key={section.title}>
      <h2>{section.title}</h2>
      <nav aria-label={section.title + " navigation"}>{section.links.map(([label, href, Icon]) =>
        <NavLink key={href} to={href} end={href === "/"} onClick={closeMobile} className={({ isActive }) => "sidebar-link" + (isActive ? " is-active" : "")}>
          <Icon aria-hidden="true" /><span>{label}</span>
        </NavLink>)}</nav>
    </section>)}
    {topics.length > 0 && <section className="sidebar-section"><h2>Explore topics</h2><nav aria-label="Topic navigation">{topics.map((topic) =>
      <NavLink className={({ isActive }) => "sidebar-link sidebar-topic" + (isActive ? " is-active" : "")} key={topic.slug} to={"/topics/" + topic.slug} onClick={closeMobile}><span aria-hidden="true">#</span><span>{topic.name}</span></NavLink>)}</nav></section>}
    <div className="sidebar-help"><span>Have something to share?</span><Link to="/submitquestion" onClick={closeMobile}>Start a discussion →</Link></div>
  </div>;
  return <div className="app-shell">
    <nav className="desktop-navigation" aria-label="Discover navigation">
      {primaryLinks.map(([label, href, Icon]) => <NavLink key={href} to={href} end={href === "/"}
        className={({ isActive }) => "sidebar-link" + (isActive ? " is-active" : "")}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}
      <details className="navigation-more" ref={moreRef}>
        <summary className={"sidebar-link" + (location.pathname.startsWith("/topics/") || sections.some((section) => section.links.some(([label, href]) => !primaryLabels.includes(label) && (location.pathname === href || location.pathname.startsWith(href + "/")))) ? " is-active" : "")}>More <FiChevronDown aria-hidden="true" /></summary>
        <div className="navigation-more-content">
          {sections.map((section) => <section className="sidebar-section" key={section.title}><h2>{section.title}</h2>
            {section.links.filter(([label]) => !primaryLabels.includes(label)).map(([label, href, Icon]) => <NavLink key={href} to={href}
              className={({ isActive }) => "sidebar-link" + (isActive ? " is-active" : "")}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}
          </section>)}
          {topics.length > 0 && <section className="sidebar-section"><h2>Explore topics</h2>{topics.map((topic) => <NavLink key={topic.slug} to={"/topics/" + topic.slug}
            className={({ isActive }) => "sidebar-link sidebar-topic" + (isActive ? " is-active" : "")}><span aria-hidden="true">#</span>{topic.name}</NavLink>)}</section>}
        </div>
      </details>
    </nav>
    {mobileOpen && <Modal title="Navigation" onClose={closeMobile} className="mobile-drawer"><div id="mobile-navigation">{sidebar}</div></Modal>}
    <div id="main-content" className="route-content" tabIndex={-1}>{children}</div>
  </div>;
};
export default AppShell;
