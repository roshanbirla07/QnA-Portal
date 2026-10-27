import { fireEvent, render, screen } from "@testing-library/react";
import PlatformSummary, { ContributionCalendar, PlatformPreview } from "./PlatformSummary";

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


test("card calendar preserves missing dates and failed-sync disclosure without inventing metrics", () => {
  const { container, rerender } = render(<PlatformPreview account={{ platform: "github", verificationStatus: "failed", lastSyncedAt: "2026-10-26",
    metrics: { contributionCalendar: { total: 7, from: "2026-10-01", to: "2026-10-03", days: [
      { date: "2026-10-01", count: 3, level: 2 }, { date: "2026-10-03", count: 4, level: 3 },
    ] } } }} />);
  expect(container.querySelectorAll("rect")).toHaveLength(2);
  expect(container.querySelectorAll("rect")[1]).toHaveAttribute("y", "48");
  expect(screen.getByRole("img")).toHaveAccessibleName(/7 contributions from 2026-10-01 to 2026-10-03/);
  expect(screen.getByText(/Refresh failed · saved snapshot/)).toBeInTheDocument();
  rerender(<PlatformPreview account={{ platform: "github", metrics: {} }} />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("Not available public repos")).toBeInTheDocument();
});
