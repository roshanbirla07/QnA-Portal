import { normalizeRatingHistory } from "./rating-history.service.js";
import ApiError from "../utils/ApiError.js";

const query = `query QnaPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking reputation }
    submitStats { acSubmissionNum { difficulty count } }
  }
  userContestRanking(username: $username) {
    attendedContestsCount rating globalRanking topPercentage
  }
}`;

const historyQuery = `query QnaContestHistory($username: String!) {
  userContestRankingHistory(username: $username) {
    attended rating contest { title startTime }
  }
}`;

const fetchProfile = async (query, handle) => {
  const response = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables: { username: handle } }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ApiError(502, `LeetCode GraphQL returned ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new ApiError(502, "LeetCode GraphQL query unavailable");
  return payload.data;
};

export const syncLeetCode = async (handle) => {
  const [data, historyData] = await Promise.all([
    fetchProfile(query, handle),
    fetchProfile(historyQuery, handle).catch(() => null),
  ]);
  const history = historyData?.userContestRankingHistory;
  const ratingHistory = normalizeRatingHistory(Array.isArray(history) ? history.filter((item) => item?.attended === true).map((item) => ({
    rating: item.rating, timestamp: item.contest?.startTime, contest: item.contest?.title,
  })) : null);
  const user = data?.matchedUser;
  if (!user) throw new ApiError(404, "LeetCode profile not found");
  const solved = Object.fromEntries(
    (user.submitStats?.acSubmissionNum || []).map((x) => [x.difficulty.toLowerCase(), x.count])
  );
  const contest = data?.userContestRanking;
  return {
    verificationStatus: "verified",
    verificationNote: "Public statistics synced from LeetCode GraphQL. This does not verify account ownership.",
    metrics: {
      ratingHistory,
      solvedTotal: solved.all ?? null,
      solvedEasy: solved.easy ?? null,
      solvedMedium: solved.medium ?? null,
      solvedHard: solved.hard ?? null,
      profileRanking: user.profile?.ranking ?? null,
      reputation: user.profile?.reputation ?? null,
      contestRating: contest?.rating ?? null,
      contestGlobalRanking: contest?.globalRanking ?? null,
      attendedContests: contest?.attendedContestsCount ?? null,
      contestTopPercentage: contest?.topPercentage ?? null,
    },
    skills: [],
    skillSignals: [],
  };
};
