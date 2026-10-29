import { fireEvent, render } from "@testing-library/react";
import Avatar, { getDefaultAvatarSeed } from "./Avatar";

test("missing photos use one of eight consistent default avatars", () => {
  const seeds = new Set(Array.from({ length: 200 }, (_,index) => getDefaultAvatarSeed(`user-${index}`)));
  expect(seeds.size).toBe(8);
  const { container, rerender } = render(<Avatar userId="user-42" name="Original name" />);
  expect(container.querySelector("svg")).toBeInTheDocument();
  expect(container.querySelector("img")).not.toBeInTheDocument();
  const artwork = container.querySelector("svg").innerHTML;
  rerender(<Avatar userId="user-42" name="Renamed member" />);
  expect(container.querySelector("svg").innerHTML).toBe(artwork);
});

test("uploaded photos take priority, broken photos fall back, and a new photo can load", () => {
  const { container, rerender } = render(<Avatar userId="user-42" src="/photo.jpg" />);
  expect(container.querySelector("img")).toHaveAttribute("src", "/photo.jpg");
  expect(container.querySelector("svg")).not.toBeInTheDocument();
  fireEvent.error(container.querySelector("img"));
  expect(container.querySelector("svg")).toBeInTheDocument();
  expect(container.querySelector("img")).not.toBeInTheDocument();
  rerender(<Avatar userId="user-42" src="/new-photo.jpg" />);
  expect(container.querySelector("img")).toHaveAttribute("src", "/new-photo.jpg");
});

test("fallbacks remain decorative, support missing names, and preserve compact sizing", () => {
  const { container } = render(<Avatar name={null} size="small" />);
  expect(container.firstChild).toHaveClass("member-avatar--small");
  expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  expect(container.querySelector("svg")).toBeInTheDocument();
});
