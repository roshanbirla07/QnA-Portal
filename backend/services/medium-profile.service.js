import ApiError from "../utils/ApiError.js";

// Medium provides an official public RSS feed, not a supported new API-token integration.
// Parse only bounded feed metadata; never copy story HTML into candidate profiles.
const unescapeXml = (value) => String(value || "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
  .replace(/&(amp|lt|gt|quot|apos);/g, (_, n) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[n])
  .trim();

const tag = (xml, name) => {
  const escaped = name.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return unescapeXml(match?.[1] || "");
};

export const syncMedium = async (handle) => {
  const response = await fetch(`https://medium.com/feed/@${encodeURIComponent(handle)}`, {
    headers: { accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404) throw new ApiError(404, "Medium RSS profile not found");
  if (!response.ok) throw new ApiError(502, `Medium RSS returned ${response.status}`);
  const xml = (await response.text()).slice(0, 1_000_000);
  if (!/<rss\b/i.test(xml) || !/<channel\b/i.test(xml)) throw new ApiError(502, "Medium returned an invalid RSS feed");
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 30);
  const articles = items.map((match) => {
    const body = match[1];
    const url = tag(body, "link");
    if (!/^https:\/\/(?:[^/]+\.)?medium\.com\//i.test(url)) return null;
    return {
      title: tag(body, "title").slice(0, 220),
      url,
      publishedAt: tag(body, "pubDate"),
      categories: [...body.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/gi)]
        .slice(0, 8).map((x) => unescapeXml(x[1]).slice(0, 80)).filter(Boolean),
    };
  }).filter(Boolean);
  const categoryCounts = new Map();
  for (const article of articles) {
    for (const name of article.categories) {
      const skill = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9+#.-]/g, "").slice(0, 80);
      if (skill) categoryCounts.set(skill, (categoryCounts.get(skill) || 0) + 1);
    }
  }
  const skillSignals = [...categoryCounts.entries()].map(([skill, count]) => ({
    skill, label: `${count} articles tagged ${skill} in recent RSS feed`,
    value: count, evidenceUrl: `https://medium.com/@${handle}`,
  })).sort((a, b) => b.value - a.value).slice(0, 20);
  return {
    verificationStatus: "verified",
    verificationNote: "Recent public stories synced from Medium RSS. This does not verify account ownership or represent all-time publishing totals.",
    metrics: { recentArticlesCount: articles.length, recentArticles: articles.slice(0, 10) },
    skills: skillSignals.map((x) => x.skill),
    skillSignals,
  };
};
