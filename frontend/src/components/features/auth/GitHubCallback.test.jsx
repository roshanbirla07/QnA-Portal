import React, { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import GitHubCallback from "./GitHubCallback";
import { apiConnector } from "../../../services/apiConnector";
jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
jest.mock("../../../services/apis", () => ({ GITHUB_COMPLETE: "/complete" }));

test("StrictMode callback exchanges once and strips authorization data from the URL", async () => {
  window.history.replaceState({}, "", "/auth/github/callback?code=private-code&state=private-state");
  apiConnector.mockResolvedValue({ data: { success: true } }); const success = jest.fn();
  render(<StrictMode><GitHubCallback onSuccess={success} onLink={jest.fn()} onError={jest.fn()} /></StrictMode>);
  await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
  expect(apiConnector).toHaveBeenCalledTimes(1); expect(window.location.search).toBe("");
});

test("an obsolete callback cannot sign in after unmount", async () => {
  let complete; apiConnector.mockReturnValue(new Promise((resolve) => { complete = resolve; })); const success = jest.fn();
  const view = render(<GitHubCallback onSuccess={success} onLink={jest.fn()} onError={jest.fn()} />); view.unmount();
  complete({ data: { success: true } }); await Promise.resolve(); expect(success).not.toHaveBeenCalled();
});
