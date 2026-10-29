import { fireEvent, render, screen } from "@testing-library/react";
import PlatformSummary, { ContributionCalendar } from "./PlatformSummary";

test("missing GitHub data never renders a simulated heatmap or invented counts", () => {
  render(<PlatformSummary account={{ platform: "github", handle: "coder", metrics: {}, profileUrl: "https://github.com/coder" }} />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText(/Contribution calendar unavailable/)).toBeInTheDocument();
  expect(screen.getAllByText("Not available")).toHaveLength(3);
});

test("calendar uses only the supplied real dates/counts and offers keyboard-readable daily data", () => {
  const calendar = { total: 3, from: "2026-10-20", to: "2026-10-21", sourceUrl: "https://github.com/users/coder/contributions",
    days: [{ date: "2026-10-20", count: 0, level: 0 }, { date: "2026-10-21", count: 3, level: 2 }] };
  const { container } = render(<ContributionCalendar calendar={calendar} />);
  expect(container.querySelectorAll("rect")).toHaveLength(2);
  expect(screen.getByRole("img")).toHaveAccessibleName(/3 contributions/);
  const details = screen.getByText("Daily contribution counts").parentElement;
  details.open = true;
  fireEvent(details, new Event("toggle"));
  expect(screen.getByRole("table")).toHaveTextContent("2026-10-21");
});

test("platform statistics label sample scope, include difficulty counts, and show Medium metadata", () => {
  render(<><PlatformSummary account={{ platform: "leetcode", metrics: { contestRating: 1880, contestGlobalRanking: 123, solvedTotal: 200, solvedEasy: 50, solvedMedium: 120, solvedHard: 30 } }} />
    <PlatformSummary account={{ platform: "codeforces", metrics: { rating: 1374, maxRating: 1400, rank: "pupil", solvedInRecentSubmissions: 12, recentSubmissionCount: 200 } }} />
    <PlatformSummary account={{ platform: "medium", metrics: { recentArticlesCount: 1, recentArticles: [{ title: "Kafka article", url: "https://medium.com/@coder/a", publishedAt: "2026-10-12T00:00:00Z", categories: ["Kafka"] }] } }} /></>);
  expect(screen.getByText("1,880")).toBeInTheDocument();
  expect(screen.getByText("120")).toBeInTheDocument();
  expect(screen.getByText("pupil")).toBeInTheDocument();
  expect(screen.getByText(/12 distinct problems solved in the latest 200/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Kafka article/ })).toHaveAttribute("href", "https://medium.com/@coder/a");
  expect(screen.getByText("Kafka")).toBeInTheDocument();
  expect(screen.getByText("12 Oct 2026")).toBeInTheDocument();
});


test("calendar preserves gaps and failed syncs are disclosed on the full profile", () => {
  const { container } = render(<PlatformSummary account={{ platform: "github", verificationStatus: "failed", lastSyncedAt: "2026-10-26", metrics: { contributionCalendar: {
    total: 7, from: "2026-10-01", to: "2026-10-03", days: [
      { date: "2026-10-01", count: 3, level: 2 }, { date: "2026-10-03", count: 4, level: 3 },
    ] } } }} />);
  expect(container.querySelectorAll("rect")).toHaveLength(2);
  expect(container.querySelectorAll("rect")[1]).toHaveAttribute("y", "72");
  expect(screen.getByRole("img")).toHaveAccessibleName(/7 contributions/);
  expect(screen.getByText(/Showing the last successful snapshot/)).toBeInTheDocument();
});

test("LeetCode ring uses only a complete difficulty breakdown and never invents a denominator or percentile", () => {
  const { container, rerender } = render(<PlatformSummary account={{ platform: "leetcode", metrics: { solvedTotal: 10, solvedEasy: 2, solvedMedium: 5, solvedHard: 3, contestTopPercentage: 4.5 } }} />);
  expect(screen.getByText("Top 4.50%")).toBeInTheDocument();
  expect(container.querySelectorAll("circle")).toHaveLength(4);
  expect(screen.queryByText(/4096/)).not.toBeInTheDocument();
  rerender(<PlatformSummary account={{ platform: "leetcode", metrics: { solvedTotal: 10, solvedEasy: 2, solvedMedium: 5, solvedHard: 1, contestTopPercentage: -1 } }} />);
  expect(container.querySelectorAll("circle")).toHaveLength(1);
  expect(screen.getByRole("img")).toHaveAccessibleName(/difficulty breakdown unavailable/);
  expect(screen.queryByText(/Top .*%/)).not.toBeInTheDocument();
});

test("profiles hide problem and repository names while retaining aggregate statistics", () => {
  render(<><PlatformSummary account={{ platform: "github", metrics: { publicRepos: 5, recentRepositories: [{ name: "REPO SECRET", url: "https://github.com/coder/repo" }] } }} />
    <PlatformSummary account={{ platform: "codeforces", metrics: { rating: 1299, recentActivity: [{ problem: "PROBLEM SECRET" }] } }} /></>);
  expect(screen.queryByText("REPO SECRET")).not.toBeInTheDocument();
  expect(screen.queryByText("PROBLEM SECRET")).not.toBeInTheDocument();
  expect(screen.getByText("Public repositories")).toBeInTheDocument();
});

test("rating charts use only dated source ratings and expose the same values in a table", () => {
  const { container, rerender } = render(<PlatformSummary account={{ platform: "codeforces", metrics: { ratingHistory: [
    { date: "2026-10-12", rating: 1299, contest: "Round B" },
    { date: "2026-10-01", rating: 1200, contest: "Round A" },
    { date: "invalid", rating: 2500 }, { date: "2026-10-10", rating: null },
  ] } }} />);
  expect(screen.getByRole("img")).toHaveAccessibleName(/2 rated contests, 1,200 to 1,299/);
  expect(container.querySelectorAll("circle")).toHaveLength(2);
  const details = screen.getByText("Contest rating data").parentElement;
  details.open = true;
  expect(screen.getByRole("table")).toHaveTextContent("Round A1,200");
  expect(screen.getByRole("table")).toHaveTextContent("Round B1,299");
  rerender(<PlatformSummary account={{ platform: "leetcode", metrics: { ratingHistory: [{ date: "2026-10-01", rating: 0 }] } }} />);
  expect(container.querySelectorAll(".developer-rating-history polyline")).toHaveLength(0);
  expect(container.querySelectorAll(".developer-rating-history circle")).toHaveLength(1);
  expect(screen.getByRole("img", { name: /1 rated contests/ })).toBeInTheDocument();
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
});

test("empty and failed history stay distinct and never create a chart", () => {
  const { rerender } = render(<PlatformSummary account={{ platform: "codeforces", metrics: { ratingHistory: [] } }} />);
  expect(screen.getByText("No rated contests yet.")).toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  rerender(<PlatformSummary account={{ platform: "codeforces", metrics: { ratingHistory: null } }} />);
  expect(screen.getByText(/Rating history unavailable/)).toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
