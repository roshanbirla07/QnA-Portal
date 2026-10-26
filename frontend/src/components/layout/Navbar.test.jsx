import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

jest.mock("../../contexts/AuthContext", () => ({ useAuth: () => ({ token: null }) }));
jest.mock("../../services/apis", () => ({ LOGOUT_USER: "/logout" }));

const setup = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Navbar onMenuToggle={() => {}} mobileOpen={false} /></MemoryRouter>);
beforeEach(() => { localStorage.clear(); delete document.documentElement.dataset.theme; });
afterEach(() => { jest.restoreAllMocks(); localStorage.clear(); });

test("first visits default to dark, and switching persists the explicit preference", () => {
  setup();
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
  expect(document.documentElement).toHaveAttribute("data-theme", "light");
  expect(localStorage.getItem("theme")).toBe("light");
});

test("an existing light preference is honored", () => {
  localStorage.setItem("theme", "light");
  setup();
  expect(document.documentElement).toHaveAttribute("data-theme", "light");
});

test("invalid preferences and blocked storage use dark without breaking the toggle", () => {
  localStorage.setItem("theme", "invalid");
  const first = setup();
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  first.unmount();
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  setup();
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
  expect(document.documentElement).toHaveAttribute("data-theme", "light");
});
