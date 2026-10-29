import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DeveloperProfileSettings from "./DeveloperProfileSettings";
import { apiConnector } from "../../../services/apiConnector";

jest.mock("../../../services/apis", () => ({ DEVELOPER_PROFILES_ROUTER: "/api/v1/developer-profiles", PROFILES_ROUTER: "/api/v1/profiles" }));
jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
const renderSettings = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><DeveloperProfileSettings /></MemoryRouter>);
beforeEach(() => {
  apiConnector.mockReset();
  apiConnector.mockImplementation(async (method, url, body) => ({
    data: { data: method === "GET" ? { user: {}, accounts: [] } : { ...body, username: body.username?.trim().toLowerCase() } },
  }));
});

test("a user without a QnA username can edit identity and explicitly publish without Postman", async () => {
  renderSettings();
  const username = await screen.findByLabelText("QnA username");
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(username).toHaveFocus();
  expect(username).toHaveAttribute("aria-invalid", "true");
  fireEvent.change(username, { target: { value: "New_User" } });
  fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "New User" } });
  fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Backend engineer" } });
  fireEvent.change(screen.getByLabelText("About"), { target: { value: "I build backend systems." } });
  fireEvent.change(screen.getByLabelText("Location"), { target: { value: "Bengaluru" } });
  fireEvent.click(screen.getByRole("checkbox", { name: /Publish my developer profile/ }));
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByText("Profile saved.");
  expect(apiConnector).toHaveBeenLastCalledWith("PATCH", "/api/v1/profiles/me/profile", {
    username: "New_User", displayName: "New User", headline: "Backend engineer", location: "Bengaluru", bio: "I build backend systems.", candidateProfileVisible: true, openToOpportunities: false,
  });
  expect(screen.getByRole("link", { name: "View public profile" })).toHaveAttribute("href", "/developers/new_user");
});

test("username collision preserves the draft and focuses the username", async () => {
  apiConnector.mockImplementation(async (method) => {
    if (method === "GET") return { data: { data: { user: {}, accounts: [] } } };
    throw Object.assign(new Error("duplicate"), { statusCode: 409 });
  });
  renderSettings();
  const username = await screen.findByLabelText("QnA username");
  fireEvent.change(username, { target: { value: "taken" } });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByText("That QnA username is already taken. Choose another.");
  expect(username).toHaveValue("taken");
  expect(username).toHaveFocus();
});

test("profile load failure can retry instead of spinning indefinitely", async () => {
  apiConnector.mockRejectedValueOnce(new Error("offline"));
  renderSettings();
  await screen.findByText("Unable to load profile settings");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByLabelText("QnA username");
});

test("an account visibility update does not require a resync or change the handle", async () => {
  apiConnector.mockImplementation(async (method) => ({ data: { data: method === "GET" ? {
    user: { username: "coder" }, accounts: [{ platform: "github", handle: "coder", visibility: "public", metrics: {} }],
  } : { platform: "github", handle: "coder", visibility: "hidden", metrics: {} } } }));
  renderSettings();
  const show = (await screen.findAllByRole("checkbox", { name: "Show this account on my published profile" }))[0];
  fireEvent.click(show);
  fireEvent.click(screen.getByRole("button", { name: "Save account visibility" }));
  await waitFor(() => expect(apiConnector).toHaveBeenLastCalledWith("PATCH", "/api/v1/developer-profiles/me/accounts/github", { visibility: "hidden" }));
  await screen.findByText("Saved visibility: Hidden — visible only to you");
});
