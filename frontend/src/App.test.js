import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

jest.mock("./config/variables", () => ({ __esModule: true, default: { apiBaseUrl: "http://localhost:5001" } }));

jest.mock("./services/apiConnector", () => ({
  apiConnector: (method, url) => Promise.resolve({ data: { data:
    url.includes("rankings") ? { allTime: [] } : url.includes("topics") ? [] : { items: [], nextCursor: null }
  } })
}));
jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("react-syntax-highlighter", () => ({ Prism: ({ children }) => <pre>{children}</pre> }));
jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({ oneLight: {}, vscDarkPlus: {} }));

test("the home shell has one discovery navigation and directs a new visitor to sign in", async () => {
  render(<AuthProvider><BrowserRouter><App /></BrowserRouter></AuthProvider>);
  expect(screen.getByRole("link", { name: "QnA Portal home" })).toHaveAttribute("href", "/");
  expect(screen.getAllByRole("navigation", { name: "Discover navigation" })).toHaveLength(1);
  expect(screen.getByRole("link", { name: /Sign in/ })).toHaveAttribute("href", "/login");
  expect(await screen.findByRole("heading", { name: "Start the next conversation" })).toBeInTheDocument();
});
