import ApiError from "../utils/ApiError.js";

const PLATFORM_CONFIG = {
  github: {
    profileUrl: (handle) => `https://github.com/${handle}`,
    handlePattern: /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/,
    sync: true,
  },
  codeforces: {
    profileUrl: (handle) => `https://codeforces.com/profile/${handle}`,
    handlePattern: /^[A-Za-z0-9_.-]{2,40}$/,
    sync: true,
  },
  leetcode: {
    profileUrl: (handle) => `https://leetcode.com/u/${handle}/`,
    handlePattern: /^[A-Za-z0-9_-]{2,40}$/,
    sync: false,
  },
  medium: {
    profileUrl: (handle) => `https://medium.com/@${handle.replace(/^@/, "")}`,
    handlePattern: /^@?[A-Za-z0-9_.-]{2,80}$/,
    sync: false,
  },
};

const normalizeSkill = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9+#.-]/g, "")
  .slice(0, 80);

const fetchJson = async (url, headers = {}) => {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "qna-portal/1.0", ...headers },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) throw new ApiError(404, "External profile not found");
  if (!response.ok) throw new ApiError(502, `External platform returned ${response.status}`);
  return response.json();
};

const normalizeExternalAccount = (platform, rawHandle) => {
  const config = PLATFORM_CONFIG[platform];
  if (!config) throw new ApiError(400, "Unsupported developer platform");
  const handle = String(rawHandle || "").trim();
  if (!config.handlePattern.test(handle)) throw new ApiError(400, "Invalid profile handle");
  const normalizedHandle = platform === "medium" ? handle.replace(/^@/, "") : handle;
  return {
    platform,
    handle: normalizedHandle,
    profileUrl: config.profileUrl(normalizedHandle),
    supportsSync: config.sync,
  };
};

const syncGithub = async (handle) => {
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const [user, repos] = await Promise.all([
    fetchJson(`https://api.github.com/users/${encodeURIComponent(handle)}`, headers),
    fetchJson(`https://api.github.com/users/${encodeURIComponent(handle)}/repos?per_page=100&sort=updated&type=owner`, headers),
  ]);

  const owned = Array.isArray(repos) ? repos.filter((repo) => !repo.fork) : [];
  const languageCounts = new Map();
  const topicCounts = new Map();
  let totalStars = 0;

  for (const repo of owned) {
    if (repo.language) languageCounts.set(repo.language, (languageCounts.get(repo.language) || 0) + 1);
    for (const topic of repo.topics || []) topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    totalStars += Number(repo.stargazers_count || 0);
  }

  const signals = [
    ...[...languageCounts.entries()].map(([skill, value]) => ({
      skill: normalizeSkill(skill),
      label: `${value} public repos`,
      value,
      evidenceUrl: `https://github.com/${handle}?tab=repositories`,
    })),
    ...[...topicCounts.entries()].map(([skill, value]) => ({
      skill: normalizeSkill(skill),
      label: `${value} repository topics`,
      value,
      evidenceUrl: `https://github.com/${handle}?tab=repositories`,
    })),
  ].filter((item) => item.skill).sort((a, b) => b.value - a.value).slice(0, 20);

  return {
    verificationStatus: "verified",
    verificationNote: "Synced from the public GitHub API.",
    metrics: {
      followers: Number(user.followers || 0),
      following: Number(user.following || 0),
      publicRepos: Number(user.public_repos || 0),
      totalStars,
      recentRepositories: owned.slice(0, 6).map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        language: repo.language || "",
        stars: Number(repo.stargazers_count || 0),
      })),
      topLanguages: [...languageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([name, count]) => ({ name, count })),
    },
    skills: [...new Set(signals.map((item) => item.skill))],
    skillSignals: signals,
  };
};

const syncCodeforces = async (handle) => {
  const [infoResult, statusResult] = await Promise.all([
    fetchJson(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`),
    fetchJson(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=200`),
  ]);

  if (infoResult.status !== "OK" || !infoResult.result?.[0]) throw new ApiError(502, "Codeforces profile sync failed");
  const user = infoResult.result[0];
  const submissions = statusResult.status === "OK" && Array.isArray(statusResult.result) ? statusResult.result : [];
  const solved = new Set();
  const tags = new Map();

  for (const submission of submissions) {
    if (submission.verdict !== "OK" || !submission.problem) continue;
    const key = `${submission.problem.contestId || "x"}:${submission.problem.index || submission.problem.name}`;
    if (solved.has(key)) continue;
    solved.add(key);
    for (const tag of submission.problem.tags || []) tags.set(tag, (tags.get(tag) || 0) + 1);
  }

  const signals = [...tags.entries()]
    .map(([skill, value]) => ({
      skill: normalizeSkill(skill),
      label: `${value} solved problems in recent submissions`,
      value,
      evidenceUrl: `https://codeforces.com/submissions/${handle}`,
    }))
    .filter((item) => item.skill)
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  return {
    verificationStatus: "verified",
    verificationNote: "Synced from the public Codeforces API.",
    metrics: {
      rating: user.rating ?? null,
      maxRating: user.maxRating ?? null,
      rank: user.rank || "",
      maxRank: user.maxRank || "",
      contribution: Number(user.contribution || 0),
      friendOfCount: Number(user.friendOfCount || 0),
      solvedInRecentSubmissions: solved.size,
    },
    skills: [...new Set(signals.map((item) => item.skill))],
    skillSignals: signals,
  };
};

const syncExternalProfile = async (profile) => {
  try {
    let synced;
    if (profile.platform === "github") synced = await syncGithub(profile.handle);
    else if (profile.platform === "codeforces") synced = await syncCodeforces(profile.handle);
    else {
      profile.verificationStatus = "linked";
      profile.verificationNote = "Profile link saved. Automatic verification is not available for this platform.";
      profile.lastSyncedAt = null;
      await profile.save();
      return profile;
    }

    profile.set({ ...synced, lastSyncedAt: new Date() });
    await profile.save();
    return profile;
  } catch (error) {
    profile.verificationStatus = "failed";
    profile.verificationNote = String(error.message || "Sync failed").slice(0, 240);
    await profile.save();
    throw error;
  }
};

export { PLATFORM_CONFIG, normalizeExternalAccount, normalizeSkill, syncExternalProfile };
