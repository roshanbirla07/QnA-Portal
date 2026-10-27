import React, { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { SiGithub, SiLeetcode, SiCodeforces, SiMedium } from "react-icons/si";

export const platforms = [
  { icon: SiGithub, description: "Code & open source", id: "github", label: "GitHub", placeholder: "github username", autoSync: true },
  { icon: SiLeetcode, description: "Problems & contests", id: "leetcode", label: "LeetCode", placeholder: "leetcode username", autoSync: true },
  { icon: SiCodeforces, description: "Competitive programming", id: "codeforces", label: "Codeforces", placeholder: "codeforces handle", autoSync: true },
  { icon: SiMedium, description: "Articles & ideas", id: "medium", label: "Medium", placeholder: "medium username", autoSync: true },
];

export const PlatformIdentity = ({ platform, detail = false }) => {
  const item = platforms.find((entry) => entry.id === platform);
  if (!item) return <span>{platform}</span>;
  const Icon = item.icon;
  return <span className="developer-platform-identity">
    <span className="developer-platform-logo"><Icon aria-hidden="true" /></span>
    <span><strong>{item.label}</strong>{detail && <small>{item.description}</small>}</span>
  </span>;
};

const number = (value) => typeof value === "number" && Number.isFinite(value)
  ? Math.round(value).toLocaleString("en-IN") : "Not available";
const date = (value) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : null;
const safeUrl = (value) => /^https:\/\//i.test(value || "") ? value : undefined;
const Stat = ({ label, value, text = false }) => <div><dt>{label}</dt><dd>{text ? value || "Not available" : number(value)}</dd></div>;

const calendarLayout = (days) => {
  const start = Date.parse(days[0].date + "T00:00:00Z");
  const offset = new Date(start).getUTCDay();
  // Missing dates stay blank rather than being presented as zero activity.
  const cells = days.map((day) => ({ ...day, index: offset + Math.round((Date.parse(day.date + "T00:00:00Z") - start) / 86400000) }));
  return { cells, columns: Math.floor(cells[cells.length - 1].index / 7) + 1 };
};

export const ContributionCalendar = ({ calendar }) => {
  const [expanded, setExpanded] = useState(false);
  const days = calendar?.days;
  if (!days?.length) return <p className="developer-note">Contribution calendar unavailable. Refresh the account to try again.</p>;
  const { cells, columns } = calendarLayout(days);
  return <figure className="developer-calendar">
    <figcaption><strong>{number(calendar.total)} contributions</strong><span>{date(calendar.from)} – {date(calendar.to)}</span></figcaption>
    <svg viewBox={`0 0 ${columns * 12} 84`} role="img" aria-label={`GitHub contribution calendar: ${number(calendar.total)} contributions from ${calendar.from} to ${calendar.to}`}>
      {cells.map((day) => <rect key={day.date} x={Math.floor(day.index / 7) * 12} y={(day.index % 7) * 12}
        width="9" height="9" rx="2" className={`contribution-level-${day.level}`}>
        <title>{day.date}: {day.count} contributions</title>
      </rect>)}
    </svg>
    <p className="developer-note"><a href={safeUrl(calendar.sourceUrl)} target="_blank" rel="noopener noreferrer">GitHub public calendar <FiArrowUpRight aria-hidden="true" /></a> · Includes any private counts the user shares publicly.</p>
    <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary>Daily contribution counts</summary>
      {expanded && <div className="developer-calendar-table"><table><thead><tr><th scope="col">Date (UTC)</th><th scope="col">Contributions</th></tr></thead>
        <tbody>{days.map((day) => <tr key={day.date}><th scope="row">{day.date}</th><td>{number(day.count)}</td></tr>)}</tbody></table></div>}
    </details>
  </figure>;
};

// Directory cards show only the imported public snapshot; full evidence stays in Work.
export const PlatformPreview = ({ account }) => {
  const metrics = account.metrics || {};
  const calendar = metrics.contributionCalendar;
  const days = calendar?.days;
  const layout = days?.length ? calendarLayout(days) : null;
  const summary = account.platform === "github"
    ? calendar?.total != null ? `${number(calendar.total)} contributions` : `${number(metrics.publicRepos)} public repos`
    : account.platform === "leetcode" ? `${number(metrics.solvedTotal)} problems solved`
    : account.platform === "codeforces" ? `${number(metrics.rating)} rating`
    : metrics.recentArticlesCount == null ? "Articles not synced" : `${number(metrics.recentArticlesCount)} recent articles`;
  return <div className="developer-platform-preview">
    <PlatformIdentity platform={account.platform} />
    <strong>{summary}</strong>
    {account.platform === "github" && days?.length > 0 && <svg className="developer-mini-calendar"
      viewBox={`0 0 ${layout.columns * 8} 56`}
      role="img" aria-label={`GitHub: ${number(calendar.total)} contributions from ${calendar.from} to ${calendar.to}`}>
      {layout.cells.map((day) => <rect key={day.date} x={Math.floor(day.index / 7) * 8} y={(day.index % 7) * 8} width="6" height="6" rx="1"
        className={`contribution-level-${day.level}`}><title>{day.date}: {day.count} contributions</title></rect>)}
    </svg>}
    {account.platform === "leetcode" && <span>Contest rating: {number(metrics.contestRating)}</span>}
    {account.platform === "codeforces" && metrics.rank && <span>{metrics.rank}</span>}
    {account.platform === "medium" && metrics.recentArticles?.[0]?.title && <span>{metrics.recentArticles[0].title}</span>}
    {account.verificationStatus === "failed" && <span className="developer-sync-warning">Refresh failed · {account.lastSyncedAt ? "saved snapshot" : "not synced"}</span>}
  </div>;
};

const PlatformSummary = ({ account }) => {
  const m = account.metrics || {};
  const synced = Boolean(account.lastSyncedAt);
  return <section className={`developer-work-platform developer-work-platform--${account.platform}`} aria-label={`${platforms.find((p) => p.id === account.platform)?.label || account.platform} work summary`}>
    <header className="developer-work-heading">
      <PlatformIdentity platform={account.platform} />
      <a href={safeUrl(account.profileUrl)} target="_blank" rel="noopener noreferrer">{account.handle} <FiArrowUpRight aria-hidden="true" /></a>
    </header>
    {account.verificationStatus === "failed" && <p className="developer-sync-warning" role="status">Refresh failed. {synced ? "Showing the last successful snapshot." : "No synced statistics yet."}</p>}
    {account.platform === "github" && <>
      <dl className="developer-stat-grid"><Stat label="Public repositories" value={m.publicRepos} /><Stat label="Stars in sampled repos" value={m.totalStars} /><Stat label="Followers" value={m.followers} /></dl>
      <ContributionCalendar calendar={m.contributionCalendar} />
      <div className="developer-skills">{m.topLanguages?.map((language) => <span className="topic-chip" key={language.name}>{language.name} · {number(language.count)} repos</span>)}</div>
      <ul className="developer-work-list">{m.recentRepositories?.slice(0, 3).map((repo) => <li key={repo.url}><a href={safeUrl(repo.url)} target="_blank" rel="noopener noreferrer">{repo.name} <FiArrowUpRight aria-hidden="true" /></a><span>{repo.language || "Language not reported"} · {number(repo.stars)} stars</span></li>)}</ul>
      <p className="developer-note">{m.repositoryScope || "Repository and language statistics cover up to 100 recently updated public, non-fork repos."}</p>
    </>}
    {account.platform === "leetcode" && <>
      <dl className="developer-stat-grid">
        <Stat label="Contest rating" value={m.contestRating} /><Stat label="Contest ranking" value={m.contestGlobalRanking} /><Stat label="Profile ranking" value={m.profileRanking} />
        <Stat label="Problems solved" value={m.solvedTotal} /><Stat label="Contests attended" value={m.attendedContests} /><Stat label="Contest top %" value={m.contestTopPercentage == null ? null : `${m.contestTopPercentage.toFixed(2)}%`} text />
      </dl>
      <dl className="developer-difficulty"><Stat label="Easy" value={m.solvedEasy} /><Stat label="Medium" value={m.solvedMedium} /><Stat label="Hard" value={m.solvedHard} /></dl>
      <p className="developer-note">Public LeetCode GraphQL snapshot. Contest statistics may be unavailable for unrated accounts.</p>
    </>}
    {account.platform === "codeforces" && <>
      <dl className="developer-stat-grid"><Stat label="Current rating" value={m.rating} /><Stat label="Max rating" value={m.maxRating} /><Stat label="Rank" value={m.rank} text /><Stat label="Max rank" value={m.maxRank} text /></dl>
      <p className="developer-note">{number(m.solvedInRecentSubmissions)} distinct problems solved in the latest {m.recentSubmissionCount == null ? "up to 200" : number(m.recentSubmissionCount)} submissions. This is not a lifetime total.</p>
      <ul className="developer-work-list">{m.recentActivity?.map((item, index) => <li key={item.url + index}>
        <a href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer">{item.problem || "Submission"} <FiArrowUpRight aria-hidden="true" /></a>
        <span>{item.verdict} · {item.language}{date(item.submittedAt) && ` · ${date(item.submittedAt)}`}</span>
      </li>)}</ul>
    </>}
    {account.platform === "medium" && <>
      <p className="developer-note">{m.recentArticlesCount == null ? "Articles not synced yet." : `${number(m.recentArticlesCount)} recent ${m.recentArticlesCount === 1 ? "article" : "articles"} in the RSS feed. Not an all-time total.`}</p>
      <ul className="developer-work-list">{m.recentArticles?.slice(0, 3).map((article) => <li key={article.url}>
        <a href={safeUrl(article.url)} target="_blank" rel="noopener noreferrer">{article.title} <FiArrowUpRight aria-hidden="true" /></a>
        {date(article.publishedAt) && <time dateTime={new Date(article.publishedAt).toISOString()}>{date(article.publishedAt)}</time>}
        <div className="developer-skills">{article.categories?.map((topic) => <span className="topic-chip" key={topic}>{topic}</span>)}</div>
      </li>)}</ul>
      {m.recentArticlesCount === 0 && <p className="developer-note">No recent articles in the public feed.</p>}
    </>}
    <p className="developer-snapshot">{synced ? `Last synced ${date(account.lastSyncedAt)} (UTC)` : "Not synced yet. Connect or refresh this account to import public data."}</p>
  </section>;
};
export default PlatformSummary;
