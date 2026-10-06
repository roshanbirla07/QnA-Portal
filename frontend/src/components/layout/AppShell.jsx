import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiHome, FiSearch, FiUsers, FiBriefcase, FiGrid, FiDollarSign, FiMessageCircle, FiStar, FiGitBranch, FiAward, FiUserPlus, FiSend, FiCompass } from "react-icons/fi";
import { apiConnector } from "../../services/apiConnector";
import { TOPICS_ROUTER } from "../../services/apis";
import Modal from "../common/Modal";

const sections = [
  { title: "Discover", links: [["Home", "/", FiHome], ["Search", "/search", FiSearch], ["Experts", "/experts", FiUsers]] },
  { title: "Career", links: [["Jobs", "/jobs", FiBriefcase], ["Companies", "/companies", FiGrid], ["Salaries", "/salaries", FiDollarSign], ["Interviews", "/interviews", FiMessageCircle], ["Reviews", "/reviews", FiStar]] },
  { title: "Community", links: [["Communities", "/communities", FiCompass], ["Projects", "/projects", FiGitBranch], ["Rankings", "/rankings", FiAward], ["Connections", "/connections", FiUserPlus], ["Referrals", "/referrals", FiSend]] },
];
const AppShell = ({ children, mobileOpen, closeMobile }) => {
  const [topics, setTopics] = useState([]);
  useEffect(() => {
    let active = true;
    apiConnector("GET", TOPICS_ROUTER, null, null, { limit: 6 })
      .then((response) => { if (active) setTopics(Array.isArray(response.data.data) ? response.data.data : []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnDesktop = () => { if (window.innerWidth >= 1024) closeMobile(); };
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
    <aside className="desktop-sidebar">{sidebar}</aside>
    {mobileOpen && <Modal title="Navigation" onClose={closeMobile} className="mobile-drawer"><div id="mobile-navigation">{sidebar}</div></Modal>}
    <div id="main-content" className="route-content" tabIndex={-1}>{children}</div>
  </div>;
};
export default AppShell;
