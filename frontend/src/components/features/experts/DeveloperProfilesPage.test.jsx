import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import DeveloperProfilesPage from "./DeveloperProfilesPage";
import { apiConnector } from "../../../services/apiConnector";

jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
jest.mock("../../../services/apis", () => ({ DEVELOPER_PROFILES_ROUTER: "/profiles", PROFILES_ROUTER: "/identity" }));
const profile = {
  user: { _id: "person-1", username: "coder", displayName: "Public Coder", headline: "Backend engineer", bio: "I build useful developer tools.", website: "https://example.com", email: "private@example.com", phone: "private-number" },
  accounts: [
    { platform: "leetcode", visibility: "public", profileUrl: "https://leetcode.com/u/coder", handle: "coder", skills: ["React"], metrics: { solvedTotal: 20, solvedEasy: 5, solvedMedium: 10, solvedHard: 5, contestRating: 1907, contestTopPercentage: 5.2 } },
    { platform: "github", visibility: "public", profileUrl: "https://github.com/coder", handle: "coder", metrics: { publicRepos: 3, recentRepositories: [{ name: "Public project", url: "https://github.com/coder/project", stars: 2 }] } },
    { platform: "medium", visibility: "hidden", metrics: { recentArticles: [{ title: "Secret article" }] }, skills: ["Hidden skill"] },
  ], topicEvidence: [{ topic: "react", reputation: 8 }],
};
const TestNavigation = () => { const navigate = useNavigate(); return <><button onClick={() => navigate(-1)}>Browser Back</button><button onClick={() => navigate("/developers/coder")}>Another profile</button></>; };
const renderPage = (path = "/developers?q=coder&page=2") => render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TestNavigation /><Routes>
  <Route path="/developers" element={<DeveloperProfilesPage />} />
  <Route path="/developers/:username" element={<DeveloperProfilesPage />} />
</Routes></MemoryRouter>);
beforeEach(() => {
  apiConnector.mockReset();
  apiConnector.mockImplementation(async (method, url) => ({ data: { data: url === "/profiles" ? { items: [profile], total: 1, page: 2, hasMore: false } : profile } }));
});

test("directory is a compact people list with a single real profile link and no inline analytics", async () => {
  renderPage();
  const row = await screen.findByRole("link", { name: "View Public Coder's profile" });
  expect(row).toHaveAttribute("href", "/developers/coder");
  expect(within(row).getByText("I build useful developer tools.")).toBeInTheDocument();
  expect(within(row).getByText("React")).toBeInTheDocument();
  expect(screen.queryByText("Hidden skill")).not.toBeInTheDocument();
  expect(screen.queryByText("Secret article")).not.toBeInTheDocument();
  expect(screen.queryByText("Explore work")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Selected developer")).not.toBeInTheDocument();
  expect(screen.queryByRole("img", { name: /contribution|problems solved/ })).not.toBeInTheDocument();
  expect(screen.queryByText("1,907")).not.toBeInTheDocument();
  expect(apiConnector).toHaveBeenCalledWith("GET", "/profiles", null, null, { q: "coder", page: "2" });
});

test("profile navigation groups public evidence and restores directory filters and paging", async () => {
  renderPage(); fireEvent.click(await screen.findByRole("link", { name: "View Public Coder's profile" }));
  await screen.findByRole("heading", { name: "Public Coder" });
  expect(screen.getByText("Top 5.20%")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /LeetCode: 20 problems solved/ })).toBeInTheDocument();
  expect(screen.queryByText("Secret article")).not.toBeInTheDocument();
  const calls = apiConnector.mock.calls.length;
  const nav = screen.getByRole("navigation", { name: "Profile sections" });
  fireEvent.click(within(nav).getByRole("link", { name: "Projects" }));
  expect(screen.getByText("Public repositories")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Public project/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("img", { name: /LeetCode/ })).not.toBeInTheDocument();
  fireEvent.click(within(nav).getByRole("link", { name: "Writing" }));
  expect(screen.getByText("No public writing to show")).toBeInTheDocument();
  expect(apiConnector).toHaveBeenCalledTimes(calls);
  fireEvent.click(screen.getByRole("link", { name: "← Developers" }));
  await screen.findByRole("link", { name: "View Public Coder's profile" });
  expect(screen.getByRole("searchbox", { name: "Search developers" })).toHaveValue("coder");
  expect(screen.getByText("Page 2")).toBeInTheDocument();
});

test("public contacts exclude private fields and sharing works without clipboard access", async () => {
  renderPage("/developers/coder?view=about");
  await screen.findByRole("heading", { name: "Public Coder" });
  expect(screen.getAllByText("I build useful developer tools.").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByText("Contact details"));
  expect(screen.getAllByRole("link", { name: /Website/ }).every((link) => link.href === "https://example.com/")).toBe(true);
  expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
  expect(screen.queryByText("private-number")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Share profile" }));
  const input = await screen.findByRole("textbox", { name: "Copy this profile link" });
  expect(input).toHaveFocus(); expect(input.value).toMatch(/\/developers\/coder$/);
});

test("directory and unpublished/unavailable profiles offer recovery without stale private content", async () => {
  apiConnector.mockRejectedValueOnce(new Error("offline"));
  renderPage(); await screen.findByText("Unable to load developers");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("link", { name: "View Public Coder's profile" });
  apiConnector.mockRejectedValueOnce(new Error("private"));
  fireEvent.click(screen.getByRole("link", { name: "View Public Coder's profile" }));
  await screen.findByText("Profile unavailable");
  expect(screen.queryByText("I build useful developer tools.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("heading", { name: "Public Coder" });
});

test("committed filters reset paging and ignore retired explorer parameters", async () => {
  renderPage("/developers?developer=coder&work=github&page=2");
  await screen.findByRole("link", { name: "View Public Coder's profile" });
  expect(apiConnector).toHaveBeenCalledWith("GET", "/profiles", null, null, { page: "2" });
  fireEvent.change(screen.getByRole("searchbox", { name: "Search developers" }), { target: { value: "New person" } });
  fireEvent.click(screen.getByRole("button", { name: /Find developers/ }));
  await waitFor(() => expect(apiConnector).toHaveBeenLastCalledWith("GET", "/profiles", null, null, { q: "New person" }));
});


test("platform/skill filters commit explicitly, restore on Back, and clear from an empty list", async () => {
  apiConnector.mockResolvedValue({ data: { data: { items: [], total: 0, page: 1, hasMore: false } } });
  renderPage("/developers");
  await screen.findByText("Make your work discoverable");
  fireEvent.change(screen.getByRole("searchbox", { name: "Skill" }), { target: { value: "Kafka" } });
  fireEvent.click(screen.getByRole("button", { name: "GitHub" }));
  expect(apiConnector).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: /Find developers/ }));
  await waitFor(() => expect(apiConnector).toHaveBeenLastCalledWith("GET", "/profiles", null, null, { skill: "kafka", platform: "github" }));
  fireEvent.click(screen.getByRole("button", { name: "Browser Back" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "All platforms" })).toHaveAttribute("aria-pressed", "true"));
  expect(screen.getByRole("searchbox", { name: "Skill" })).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "Medium" })); fireEvent.click(screen.getByRole("button", { name: /Find developers/ }));
  await screen.findByText("No developers found");
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  await screen.findByText("Make your work discoverable");
});

test("a late response for another username cannot replace the current profile", async () => {
  let oldResponse;
  apiConnector.mockReturnValueOnce(new Promise((resolve) => { oldResponse = resolve; })).mockResolvedValue({ data: { data: profile } });
  renderPage("/developers/old-person");
  fireEvent.click(screen.getByRole("button", { name: "Another profile" }));
  await screen.findByRole("heading", { name: "Public Coder" });
  oldResponse({ data: { data: { ...profile, user: { ...profile.user, displayName: "Stale person" } } } });
  await Promise.resolve();
  expect(screen.queryByRole("heading", { name: "Stale person" })).not.toBeInTheDocument();
});


test("a profile with no connected accounts still shows its About information", async () => {
  apiConnector.mockResolvedValue({ data: { data: { ...profile, accounts: [] } } });
  renderPage("/developers/coder");
  await screen.findByText("No public connected platforms yet");
  expect(screen.getByRole("heading", { name: "About", exact: true })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /More about Public Coder/ })).toHaveAttribute("href", "/developers/coder?view=about");
});
