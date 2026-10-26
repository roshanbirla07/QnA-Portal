import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { apiConnector } from "../../../services/apiConnector";

jest.mock("../../../config/variables", () => ({ __esModule: true, default: { apiBaseUrl: "http://localhost:3100" } }));
jest.mock("../../../services/apiConnector", () => ({ apiConnector: jest.fn() }));
jest.mock("../../../contexts/AuthContext", () => ({ useAuth: () => ({ token: null }) }));

test("discovery failures preserve available content and can be retried independently", async () => {
  let rankingsCalls = 0;
  apiConnector.mockImplementation((method, url) => {
    if (url.includes("rankings") && rankingsCalls++ === 0) return Promise.reject(new Error("private server details"));
    const data = url.includes("rankings") ? { allTime: [{ userId: "member", displayName: "Public contributor", points: 42 }] }
      : url.includes("topics") ? [{ slug: "kafka", name: "Kafka" }]
      : { items: [], nextCursor: null };
    return Promise.resolve({ data: { data } });
  });
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Home /></MemoryRouter>);
  await screen.findByRole("heading", { name: "Some community discoveries couldn't load" });
  expect(screen.getByRole("link", { name: "# Kafka" })).toHaveAttribute("href", "/topics/kafka");
  expect(screen.queryByText("private server details")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry discoveries" }));
  await screen.findByRole("link", { name: "Public contributor" });
  expect(screen.getByText("42 QnA reputation")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Some community discoveries couldn't load" })).not.toBeInTheDocument();
  expect(rankingsCalls).toBe(2);
});
