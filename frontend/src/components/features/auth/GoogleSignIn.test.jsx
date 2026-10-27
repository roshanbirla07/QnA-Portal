import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import GoogleSignIn from "./GoogleSignIn";
import { apiConnector } from "../../../services/apiConnector";
import { loadGoogleIdentity } from "../../../services/googleIdentity";

jest.mock("../../../services/apis", () => ({ AUTH_CONFIG: "/config", GOOGLE_CHALLENGE: "/challenge" }));
jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
jest.mock("../../../services/googleIdentity", () => ({ loadGoogleIdentity: jest.fn() }));
let identity, options;
beforeEach(() => {
  options = undefined;
  apiConnector.mockReset(); loadGoogleIdentity.mockReset();
  apiConnector.mockImplementation((method, url) => Promise.resolve({ data: { data: url === "/config" ? { googleClientId: "client.apps.googleusercontent.com" } : { nonce: "server-nonce" } } }));
  identity = { initialize: jest.fn((value) => { options = value; }), renderButton: jest.fn((node) => { const button = document.createElement("button"); button.textContent = "Provider sign in"; button.onclick = () => options.callback({ credential: "provider-token" }); node.appendChild(button); }) };
  loadGoogleIdentity.mockResolvedValue(identity);
  jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);
  global.ResizeObserver = class { observe() {} disconnect() {} };
});
afterEach(() => { jest.restoreAllMocks(); delete global.ResizeObserver; });

test("uses the backend client ID and nonce with the official explicit popup button", async () => {
  const callback = jest.fn().mockResolvedValue();
  const view = render(<GoogleSignIn onCredential={callback} disabled={false} />);
  await screen.findByRole("button", { name: "Provider sign in" });
  expect(options).toMatchObject({ client_id: "client.apps.googleusercontent.com", nonce: "server-nonce", auto_select: false, ux_mode: "popup" });
  expect(apiConnector).toHaveBeenCalledWith("POST", "/challenge", {});
  fireEvent.click(screen.getByRole("button", { name: "Provider sign in" }));
  await waitFor(() => expect(callback).toHaveBeenCalledWith("provider-token"));
  view.rerender(<GoogleSignIn onCredential={callback} disabled />);
  options.callback({ credential: "duplicate" });
  expect(callback).toHaveBeenCalledTimes(1);
});

test("unconfigured Google sign-in leaves email authentication available", async () => {
  apiConnector.mockResolvedValue({ data: { data: { googleClientId: null } } });
  render(<GoogleSignIn onCredential={() => {}} />);
  await screen.findByText(/Google sign-in is unavailable/);
  expect(loadGoogleIdentity).not.toHaveBeenCalled();
});

test("script failures expose a working retry", async () => {
  loadGoogleIdentity.mockRejectedValueOnce(new Error("network"));
  render(<GoogleSignIn onCredential={() => {}} />);
  fireEvent.click(await screen.findByRole("button", { name: "Retry Google sign-in" }));
  await screen.findByRole("button", { name: "Provider sign in" });
  expect(loadGoogleIdentity).toHaveBeenCalledTimes(2);
});
