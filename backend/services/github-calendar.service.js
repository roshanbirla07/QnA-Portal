import ApiError from "../utils/ApiError.js";

// Public, unauthenticated GitHub calendar HTML. Do not use a privileged token here.
// This is not a supported API: reject changed/missing markup rather than synthesizing days.
export const parseGithubCalendar = (html, sourceUrl) => {
  const attr = (markup, name) => markup.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
  const counts = new Map();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/gi)) {
    const count = match[2].trim().match(/^(No|[\d,]+) contributions? on /);
    if (count) counts.set(attr(match[1], "for"), count[1] === "No" ? 0 : Number(count[1].replaceAll(",", "")));
  }
  const dates = new Set();
  const days = [];
  for (const match of html.matchAll(/<td\b([^>]*)>/gi)) {
    const date = attr(match[1], "data-date");
    if (!date) continue;
    const level = Number(attr(match[1], "data-level"));
    const count = counts.get(attr(match[1], "id"));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (!Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) ||
        !Number.isInteger(count) || count < 0 || !Number.isInteger(level) || level < 0 || level > 4 ||
        (level === 0) !== (count === 0) || dates.has(date)) {
      throw new ApiError(502, "GitHub contribution calendar format changed");
    }
    dates.add(date);
    days.push({ date, count, level });
  }
  if (!days.length) throw new ApiError(502, "GitHub contribution calendar unavailable");
  days.sort((a, b) => a.date.localeCompare(b.date));
  for (let index = 1; index < days.length; index += 1) {
    if (Date.parse(days[index].date) - Date.parse(days[index - 1].date) !== 86400000) {
      throw new ApiError(502, "GitHub contribution calendar is incomplete");
    }
  }
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const heading = html.match(/<h2\b[^>]*id="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/i);
  const reported = heading?.[1].trim().match(/^([\d,]+)\s+contributions?/);
  if (reported && Number(reported[1].replaceAll(",", "")) !== total) {
    throw new ApiError(502, "GitHub contribution calendar is incomplete");
  }
  return {
    sourceUrl,
    days,
    total,
    from: days[0].date,
    to: days[days.length - 1].date,
  };
};
