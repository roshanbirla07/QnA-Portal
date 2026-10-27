import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthPage from "./AuthPage";
import { apiConnector } from "../../../services/apiConnector";

const mockSetToken = jest.fn();
jest.mock("../../../contexts/AuthContext", () => ({ useAuth: () => ({ setToken: mockSetToken }) }));
jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
jest.mock("../../../services/apis", () => ({ LOGIN_USER: "/login-api", SIGNUP_USER: "/signup-api", GOOGLE_LOGIN: "/google-api" }));
jest.mock("./GoogleSignIn", () => ({ __esModule: true, default: ({ onCredential, disabled }) => <button disabled={disabled} onClick={() => onCredential("credential").catch(() => {})}>Continue with Google</button> }));
const setup = (signup = false) => render(<MemoryRouter initialEntries={[{ pathname: "/auth", state: { from: { pathname: "/projects", search: "?tag=nodejs" } } }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/auth" element={<AuthPage signup={signup} />} /><Route path="/projects" element={<h1>Protected projects</h1>} /></Routes></MemoryRouter>);
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

test("Google email collisions require explicit password confirmation before signing in", async () => {
  apiConnector.mockRejectedValueOnce(Object.assign(new Error("link"), { statusCode: 409, response: { data: { code: "GOOGLE_LINK_REQUIRED" } } }))
    .mockResolvedValueOnce({ data: { success: true, data: { token: "session" } } });
  setup(); fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
  await screen.findByRole("heading", { name: "Link your Google account" });
  expect(mockSetToken).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Existing QnA password")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Existing QnA password"), { target: { value: "existing-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm and link Google" }));
  await screen.findByRole("heading", { name: "Protected projects" });
  expect(apiConnector).toHaveBeenLastCalledWith("POST", "/google-api", { credential: "credential", password: "existing-password" });
});

test("Google sign-in sends the provider credential without trusting browser identity fields", async () => {
  apiConnector.mockResolvedValue({ data: { success: true, data: { token: "google-session" } } });
  setup(); fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
  await waitFor(() => expect(mockSetToken).toHaveBeenCalledWith("google-session"));
  expect(apiConnector).toHaveBeenCalledWith("POST", "/google-api", { credential: "credential" });
});
