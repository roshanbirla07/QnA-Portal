import React, { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { SiGithub, SiLeetcode, SiMedium } from "react-icons/si";

const CodeforcesLogo = () => <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
  <rect x="1" y="10" width="6" height="13" rx="1" fill="#f6c445" />
  <rect x="9" y="1" width="6" height="22" rx="1" fill="#54a6d8" />
  <rect x="17" y="6" width="6" height="17" rx="1" fill="#d85c66" />
</svg>;

export const platforms = [
  { icon: SiGithub, description: "Code & open source", id: "github", label: "GitHub", placeholder: "github username", autoSync: true },
  { icon: SiLeetcode, description: "Problems & contests", id: "leetcode", label: "LeetCode", placeholder: "leetcode username", autoSync: true },
  { icon: CodeforcesLogo, description: "Competitive programming", id: "codeforces", label: "Codeforces", placeholder: "codeforces handle", autoSync: true },
  { icon: SiMedium, description: "Articles & ideas", id: "medium", label: "Medium", placeholder: "medium username", autoSync: true },
];

export const PlatformLogo = ({ platform }) => {
  const Icon = platforms.find((item) => item.id === platform)?.icon;
  return Icon ? <span className={`developer-platform-logo developer-platform-logo--${platform}`}><Icon aria-hidden="true" /></span> : null;
};

export const PlatformIdentity = ({ platform, detail = false }) => {
  const item = platforms.find((entry) => entry.id === platform);
  if (!item) return <span>{platform}</span>;
  return <span className="developer-platform-identity">
    <PlatformLogo platform={platform} />
    <span><strong>{item.label}</strong>{detail && <small>{item.description}</small>}</span>
  </span>;
};

const number = (value) => typeof value === "number" && Number.isFinite(value)
  ? Math.round(value).toLocaleString("en-IN") : "Not available";
const date = (value) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : null;
const safeUrl = (value) => /^https:\/\//i.test(value || "") ? value : undefined;
const Stat = ({ label, value, text = false }) => <div><dt>{label}</dt><dd>{text ? value || "Not available" : number(value)}</dd></div>;

const SolvedGauge = ({ metrics }) => {
  const counts = [metrics.solvedEasy, metrics.solvedMedium, metrics.solvedHard];
  const total = metrics.solvedTotal;
  const breakdown = Number.isFinite(total) && total > 0 && counts.every((count) => Number.isFinite(count) && count >= 0) && counts.reduce((sum, count) => sum + count, 0) === total;
  let offset = 0;
  return <div className="developer-solved-gauge">
    <svg viewBox="0 0 100 100" role="img" aria-label={`LeetCode: ${number(total)} problems solved${breakdown ? `; easy ${counts[0]}, medium ${counts[1]}, hard ${counts[2]}` : "; difficulty breakdown unavailable"}`}>
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--line)" strokeWidth="6" />
      {breakdown && counts.map((count, index) => {
        const length = count / total * 100, start = offset;
        offset += length;
        return <circle key={index} cx="50" cy="50" r="42" pathLength="100" fill="none" stroke={["var(--success)", "var(--action)", "var(--danger)"][index]} strokeWidth="6" strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} />;
      })}
    </svg><span aria-hidden="true"><strong>{Number.isFinite(total) ? number(total) : "—"}</strong><small>Solved</small></span>
  </div>;
};

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

export const RatingHistory = ({ history, platform }) => {
  const points = (Array.isArray(history) ? history : []).filter((item) => item && Number.isFinite(item.rating) && item.rating >= 0 && date(item.date))
    .slice().sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (!points.length) return <p className="developer-note">{Array.isArray(history) && !history.length
    ? "No rated contests yet." : "Rating history unavailable. Refresh this account to try again."}</p>;
  const min = points.reduce((value, item) => Math.min(value, item.rating), Infinity);
  const max = points.reduce((value, item) => Math.max(value, item.rating), -Infinity);
  const first = Date.parse(points[0].date), last = Date.parse(points[points.length - 1].date);
  const coordinates = points.map((item) => ({ ...item,
    x: last === first ? 220 : 8 + (Date.parse(item.date) - first) / (last - first) * 424,
    y: max === min ? 75 : 130 - (item.rating - min) / (max - min) * 110,
  }));
  return <figure className="developer-rating-history">
    <figcaption>{platform} contest rating history</figcaption>
    <div className="developer-rating-plot">
      <div className={`developer-rating-scale${max === min ? " developer-rating-scale--constant" : ""}`} aria-hidden="true"><span>{number(max)}</span>{max !== min && <span>{number(min)}</span>}</div>
    <svg viewBox="0 0 440 150" role="img" aria-label={`${platform} rating history: ${points.length} rated contests, ${number(min)} to ${number(max)}`}>
      <line x1="8" y1="20" x2="432" y2="20" className="rating-grid" />
      <line x1="8" y1="130" x2="432" y2="130" className="rating-grid" />
      {coordinates.length > 1 && <polyline points={coordinates.map((item) => `${item.x},${item.y}`).join(" ")} fill="none" className="rating-line" />}
      {coordinates.map((item, index) => <circle key={index} cx={item.x} cy={item.y} r="3" className="rating-point"><title>{date(item.date)} · {item.contest || "Contest"}: {number(item.rating)}</title></circle>)}
    </svg></div>
    <div className="developer-rating-dates" aria-hidden="true"><span>{date(points[0].date)}</span>{last !== first && <span>{date(points[points.length - 1].date)}</span>}</div>
    <details><summary>Contest rating data</summary><div className="developer-calendar-table"><table>
      <caption className="sr-only">{platform} contest rating history</caption><thead><tr><th scope="col">Date (UTC)</th><th scope="col">Contest</th><th scope="col">Rating</th></tr></thead>
      <tbody>{points.map((item, index) => <tr key={index}><th scope="row">{date(item.date)}</th><td>{item.contest || "Contest"}</td><td>{number(item.rating)}</td></tr>)}</tbody>
    </table></div></details>
  </figure>;
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
      <p className="developer-note">{m.repositoryScope || "Repository and language statistics cover up to 100 recently updated public, non-fork repos."}</p>
    </>}
    {account.platform === "leetcode" && <>
      <div className="developer-solved-overview">
        <div className="developer-contest-rating"><small>Contest rating</small><strong aria-label={`Contest rating: ${number(m.contestRating)}`}>{Number.isFinite(m.contestRating) ? number(m.contestRating) : "—"}</strong>
          {Number.isFinite(m.contestTopPercentage) && m.contestTopPercentage >= 0 && m.contestTopPercentage <= 100 && <span className="developer-contest-percentile">Top {m.contestTopPercentage.toFixed(2)}%</span>}
        </div><SolvedGauge metrics={m} />
      </div>
      <dl className="developer-stat-grid">
        <Stat label="Contest ranking" value={m.contestGlobalRanking} /><Stat label="Profile ranking" value={m.profileRanking} /><Stat label="Contests attended" value={m.attendedContests} />
      </dl>
      <dl className="developer-difficulty"><Stat label="Easy" value={m.solvedEasy} /><Stat label="Medium" value={m.solvedMedium} /><Stat label="Hard" value={m.solvedHard} /></dl>
      <RatingHistory history={m.ratingHistory} platform="LeetCode" />
      <p className="developer-note">Contest statistics may be unavailable for accounts without contest activity.</p>
    </>}
    {account.platform === "codeforces" && <>
      <dl className="developer-stat-grid"><Stat label="Current rating" value={m.rating} /><Stat label="Current rank" value={m.rank} text /></dl>
      <dl className="developer-stat-grid"><Stat label="Max rating" value={m.maxRating} /><Stat label="Max rank" value={m.maxRank} text /></dl>
      <p className="developer-note">{number(m.solvedInRecentSubmissions)} distinct problems solved in the latest {m.recentSubmissionCount == null ? "up to 200" : number(m.recentSubmissionCount)} submissions. This is not a lifetime total.</p>
      <RatingHistory history={m.ratingHistory} platform="Codeforces" />
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
