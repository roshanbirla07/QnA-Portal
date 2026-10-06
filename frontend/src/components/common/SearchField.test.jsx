import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import SearchField from "./SearchField";

const Harness = ({ submit = () => {} }) => {
  const [value, setValue] = useState("");
  return <form noValidate onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <SearchField value={value} onChange={setValue} label="Search knowledge" />
  </form>;
};
test("clearing a query resets its value and returns keyboard focus", () => {
  render(<Harness />);
  const input = screen.getByRole("searchbox");
  fireEvent.change(input, { target: { value: "kafka" } });
  fireEvent.click(screen.getByRole("button", { name: "Clear search knowledge" }));
  expect(input).toHaveValue("");
  expect(input).toHaveFocus();
  expect(screen.queryByRole("button", { name: "Clear search knowledge" })).not.toBeInTheDocument();
});
test("Enter during IME composition cannot submit the search", () => {
  render(<Harness />);
  const input = screen.getByRole("searchbox");
  expect(fireEvent.keyDown(input, { key: "Enter", isComposing: true, keyCode: 229 })).toBe(false);
  expect(fireEvent.keyDown(input, { key: "Enter", isComposing: false, keyCode: 13 })).toBe(true);
});

