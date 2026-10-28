import { fireEvent, render, screen } from "@testing-library/react";
import GitHubSignIn from "./GitHubSignIn";
import { apiConnector } from "../../../services/apiConnector";
jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
jest.mock("../../../services/apis", () => ({ AUTH_CONFIG: "/auth-config" }));
beforeEach(() => apiConnector.mockReset());

test("GitHub requires an explicit click and respects busy state", async () => {
  apiConnector.mockResolvedValue({ data: { data: { githubEnabled: true } } });
  const start = jest.fn(); const view = render(<GitHubSignIn onStart={start} disabled={false} />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading GitHub");
  const button = await screen.findByRole("button", { name: "Continue with GitHub" });
  expect(start).not.toHaveBeenCalled(); fireEvent.click(button); expect(start).toHaveBeenCalledTimes(1);
  view.rerender(<GitHubSignIn onStart={start} disabled />); fireEvent.click(button); expect(start).toHaveBeenCalledTimes(1);
});

test("unconfigured provider keeps email sign-in available without a false button", async () => {
  apiConnector.mockResolvedValue({ data: { data: { githubEnabled: false } } }); render(<GitHubSignIn onStart={jest.fn()} />);
  await screen.findByText("GitHub sign-in is unavailable. You can use email and password.");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("config errors offer a working retry", async () => {
  apiConnector.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ data: { data: { githubEnabled: true } } });
  render(<GitHubSignIn onStart={jest.fn()} />);
  fireEvent.click(await screen.findByRole("button", { name: "Retry GitHub sign-in" }));
  await screen.findByRole("button", { name: "Continue with GitHub" }); expect(apiConnector).toHaveBeenCalledTimes(2);
});
