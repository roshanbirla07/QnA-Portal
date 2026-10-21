import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import DeveloperProfilesPage from "./DeveloperProfilesPage";
import { apiConnector } from "../../../services/apiConnector";

jest.mock("../../../services/apis", () => ({ DEVELOPER_PROFILES_ROUTER: "/api/v1/developer-profiles", PROFILES_ROUTER: "/api/v1/profiles" }));
jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
jest.mock("../../../contexts/AuthContext", () => ({ useAuth: () => ({}) }));

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output aria-label="Current query">{location.search}</output><button onClick={() => navigate(-1)}>Back</button></>;
};
const setup = (entry = "/developers") => render(
  <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Navigation /><DeveloperProfilesPage />
  </MemoryRouter>
);
beforeEach(() => {
  apiConnector.mockReset();
  apiConnector.mockResolvedValue({ data: { data: { items: [], total: 0 } } });
});

test("platform filters commit on submit, restore with Back, and clear together", async () => {
  setup();
  await screen.findByText("Make your work discoverable");
  for (const name of ["GitHub", "LeetCode", "Codeforces", "Medium"]) {
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  }
  fireEvent.change(screen.getByRole("searchbox", { name: "Skill" }), { target: { value: "Kafka" } });
  fireEvent.click(screen.getByRole("button", { name: "GitHub" }));
  expect(apiConnector).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Find developers" }));
  await waitFor(() => expect(apiConnector).toHaveBeenLastCalledWith("GET", expect.any(String), null, null, { skill: "kafka", platform: "github" }));
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "All platforms" })).toHaveAttribute("aria-pressed", "true"));
  expect(screen.getByRole("searchbox", { name: "Skill" })).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "Medium" }));
  fireEvent.click(screen.getByRole("button", { name: "Find developers" }));
  await screen.findByText("No developers found");
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  await waitFor(() => expect(screen.getByLabelText("Current query")).toHaveTextContent(""));
  expect(screen.getByRole("button", { name: "All platforms" })).toHaveAttribute("aria-pressed", "true");
});

test("failed directory requests offer a working retry without exposing server messages", async () => {
  apiConnector.mockRejectedValueOnce(new Error("internal database details"));
  setup("/developers?platform=leetcode");
  await screen.findByText("Unable to load developers");
  expect(screen.queryByText("internal database details")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText("No developers found");
  expect(apiConnector).toHaveBeenCalledTimes(2);
});

test("directory Work sections show public summaries and never show hidden account metrics or skills", async () => {
  apiConnector.mockResolvedValue({ data: { data: {
    total: 1, items: [{
      user: { _id: "u", username: "coder", displayName: "Coder" }, topicEvidence: [],
      accounts: [
        { platform: "leetcode", handle: "public", visibility: "public", metrics: { contestRating: 1880, solvedTotal: 123 } },
        { platform: "medium", handle: "hidden", visibility: "hidden", skills: ["private-topic"], metrics: { recentArticles: [{ title: "Private article", url: "https://medium.com/private" }] } },
      ],
    }],
  } } });
  setup();
  await screen.findByText("Coder");
  expect(screen.getByRole("heading", { name: "Work" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "LeetCode work summary" })).toHaveTextContent("1,880");
  expect(screen.queryByText("Private article")).not.toBeInTheDocument();
  expect(screen.queryByText("#private-topic")).not.toBeInTheDocument();
});
