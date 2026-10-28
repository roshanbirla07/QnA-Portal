import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthPage from "./AuthPage";
import { apiConnector } from "../../../services/apiConnector";

const mockSetToken = jest.fn();
jest.mock("../../../contexts/AuthContext", () => ({ useAuth: () => ({ setToken: mockSetToken }) }));
jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
jest.mock("../../../services/apis", () => ({ LOGIN_USER: "/login-api", SIGNUP_USER: "/signup-api", GITHUB_START: "/github-start", GITHUB_COMPLETE: "/github-complete", GITHUB_LINK: "/github-link", GITHUB_CANCEL: "/github-cancel" }));
jest.mock("./GitHubSignIn", () => ({ __esModule: true, default: ({ onStart, disabled }) => <button disabled={disabled} onClick={onStart}>Continue with GitHub</button> }));
const setup = (signup = false, githubCallback = false) => render(<MemoryRouter initialEntries={[{ pathname: "/auth", state: { from: { pathname: "/projects", search: "?tag=nodejs" } } }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/auth" element={<AuthPage signup={signup} githubCallback={githubCallback} />} /><Route path="/projects" element={<h1>Protected projects</h1>} /></Routes></MemoryRouter>);
beforeEach(() => { apiConnector.mockReset(); mockSetToken.mockReset(); });

test("email login validates inline, masks/reveals passwords, and restores the intended route", async () => {
  apiConnector.mockResolvedValue({ data: { success: true, data: { token: "session" } } });
  setup(); fireEvent.click(screen.getByRole("button", { name: "Sign in", exact: true }));
  expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email");
  expect(screen.getByLabelText("Email")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "person@example.com" } });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "password" } });
  expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute("type", "text");
  fireEvent.click(screen.getByRole("button", { name: "Sign in", exact: true }));
  await screen.findByRole("heading", { name: "Protected projects" });
  expect(mockSetToken).toHaveBeenCalledWith("session");
  expect(apiConnector).toHaveBeenCalledWith("POST", "/login-api", { email: "person@example.com", password: "password" });
});

test("failed login preserves email, clears password, and hides raw server errors", async () => {
  apiConnector.mockRejectedValue(Object.assign(new Error("secret database detail"), { statusCode: 401 }));
  setup();
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "person@example.com" } });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "wrong" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in", exact: true }));
  await screen.findByText("Email or password is incorrect.");
  expect(screen.getByLabelText("Email")).toHaveValue("person@example.com");
  expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("");
  expect(screen.queryByText("secret database detail")).not.toBeInTheDocument();
});

test("signup blocks duplicate submissions while the request is pending", async () => {
  let complete; apiConnector.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
  setup(true);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "password" } });
  fireEvent.click(screen.getByRole("button", { name: "Create account", exact: true }));
  expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  fireEvent.submit(screen.getByRole("button", { name: "Signing in…" }).closest("form"));
  expect(apiConnector).toHaveBeenCalledTimes(1);
  complete({ data: { success: true, data: { token: "session" } } });
  await screen.findByRole("heading", { name: "Protected projects" });
});

test("GitHub email collisions require password proof without exposing the identity to the browser", async () => {
  window.history.replaceState({}, "", "/auth/github/callback?code=temporary-code&state=random-state");
  apiConnector.mockRejectedValueOnce(Object.assign(new Error("link"), { statusCode: 409, response: { data: { code: "GITHUB_LINK_REQUIRED" } } }))
    .mockRejectedValueOnce(Object.assign(new Error("wrong"), { statusCode: 401, response: { data: { code: "GITHUB_PASSWORD_INVALID" } } }))
    .mockResolvedValueOnce({ data: { success: true, data: { token: "session", returnTo: "/projects?tag=nodejs" } } });
  setup(false, true);
  await screen.findByRole("heading", { name: "Link your GitHub account" });
  expect(mockSetToken).not.toHaveBeenCalled();
  expect(window.location.search).toBe("");
  expect(apiConnector).toHaveBeenCalledWith("POST", "/github-complete", { code: "temporary-code", state: "random-state", error: null });
  expect(screen.getByLabelText("Existing QnA password")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Existing QnA password"), { target: { value: "wrong" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm and link GitHub" }));
  await screen.findByText("The password could not be verified. Try again.");
  expect(screen.getByLabelText("Existing QnA password")).toHaveValue("");
  fireEvent.change(screen.getByLabelText("Existing QnA password"), { target: { value: "existing-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm and link GitHub" }));
  await screen.findByRole("heading", { name: "Protected projects" });
  expect(apiConnector).toHaveBeenLastCalledWith("POST", "/github-link", { password: "existing-password" });
});

test("GitHub callback errors leave local login usable and hide raw provider errors", async () => {
  window.history.replaceState({}, "", "/auth/github/callback?error=access_denied&state=random-state");
  apiConnector.mockRejectedValueOnce(new Error("raw provider detail"));
  setup(false, true);
  await screen.findByText("GitHub sign-in ended or could not be verified. Try again or use email and password.");
  expect(screen.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  expect(window.location.search).toBe("");
  expect(screen.queryByText("raw provider detail")).not.toBeInTheDocument();
});

test("GitHub start failure retains the form and cancel linking clears the backend proof", async () => {
  apiConnector.mockRejectedValueOnce(new Error("unavailable"));
  const first = setup();
  fireEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));
  await screen.findByText("GitHub sign-in could not start. Please try again.");
  expect(apiConnector).toHaveBeenCalledWith("POST", "/github-start", { returnTo: "/projects?tag=nodejs" });
  first.unmount();
  apiConnector.mockRejectedValueOnce(Object.assign(new Error("link"), { response: { data: { code: "GITHUB_LINK_REQUIRED" } } }))
    .mockResolvedValueOnce({ data: { success: true, data: {} } });
  setup(false, true);
  await screen.findByRole("heading", { name: "Link your GitHub account" });
  fireEvent.click(screen.getByRole("button", { name: "Cancel linking" }));
  await screen.findByLabelText("Email");
  expect(apiConnector).toHaveBeenLastCalledWith("POST", "/github-cancel", {});
});
