import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiConnector } from "../../services/apiConnector";
import { TOPICS_ROUTER } from "../../services/apis";

const sections = [
  { title: "Discover", links: [["Home", "/"], ["Search", "/search"], ["Topics", "/communities"], ["Experts", "/experts"]] },
  { title: "Career", links: [["Jobs", "/jobs"], ["Companies", "/companies"], ["Salaries", "/salaries"], ["Interviews", "/interviews"], ["Reviews", "/reviews"]] },
  { title: "Community", links: [["Communities", "/communities"], ["Projects", "/projects"], ["Rankings", "/rankings"], ["Connections", "/connections"], ["Referrals", "/referrals"]] },
];

const SideLink = ({ label, href, current, onClick }) => <Link to={href} onClick={onClick}
  aria-current={current === href ? "page" : undefined}
  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${current === href ?
    "bg-primary-blue/10 text-primary-blue" : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"}`}>
  {label}
</Link>;

const AppShell = ({ children, mobileOpen, closeMobile }) => {
  const location = useLocation();
  const [topics, setTopics] = useState([]);
  useEffect(() => {
    let active = true;
    apiConnector("GET", TOPICS_ROUTER, null, null, { limit: 6 })
      .then((response) => { if (active) setTopics(Array.isArray(response.data.data) ? response.data.data : []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  const sidebar = <div className="space-y-6">{sections.map((section) => <section key={section.title}>
    <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">{section.title}</h2>
    <nav aria-label={`${section.title} navigation`} className="space-y-0.5">{section.links.map(([label, href]) =>
      <SideLink key={`${label}-${href}`} label={label} href={href} current={location.pathname} onClick={closeMobile} />)}</nav>
  </section>)}</div>;
  return <div className="app-shell mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
    {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={closeMobile} aria-hidden="true" />}
    <aside className={`app-sidebar fixed inset-y-16 left-0 z-50 w-64 overflow-y-auto border-r bg-bg-card px-4 py-6 transition-transform lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ borderColor: "var(--line)" }}>
      {sidebar}
    </aside>
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_260px]">
      <aside className="hidden lg:block border-r py-8 pr-4" style={{ borderColor: "var(--line)" }}><div className="sticky top-24">{sidebar}</div></aside>
      <div className="min-w-0">{children}</div>
      <aside className="hidden xl:block border-l py-8 pl-6" style={{ borderColor: "var(--line)" }}>
        <div className="sticky top-24 space-y-6">
          <section className="surface-card p-5"><h2 className="text-base font-semibold">Trending topics</h2>
            {topics.length ? <div className="flex flex-wrap gap-2 mt-4">{topics.map((topic) => <Link key={topic.slug} to={`/topics/${topic.slug}`} className="topic-chip">#{topic.name}</Link>)}</div> :
              <p className="text-sm text-text-secondary mt-3">Explore topics shared by the community.</p>}
          </section>
          <section className="surface-card p-5"><h2 className="text-base font-semibold">Build your profile</h2>
            <p className="text-sm text-text-secondary mt-2">Share what you know, discover new roles, and meet collaborators.</p>
            <Link to="/jobs" className="text-sm font-semibold text-primary-blue mt-4 inline-block">Explore jobs →</Link>
          </section>
        </div>
      </aside>
    </div>
  </div>;
};

export default AppShell;
