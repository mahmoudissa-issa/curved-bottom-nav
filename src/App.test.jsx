// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect } from "vitest";
import App from "./App";

test("shows the page for each clicked tab", async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByText("Home page content")).toBeTruthy();

  await user.click(screen.getByRole("button", { name: /favorites/i }));
  expect(screen.getByText("Your favorite items")).toBeTruthy();
  expect(screen.queryByText("Home page content")).toBeNull();

  await user.click(screen.getByRole("button", { name: /profile/i }));
  expect(screen.getByText("Your profile")).toBeTruthy();
  expect(screen.queryByText("Your favorite items")).toBeNull();

  await user.click(screen.getByRole("button", { name: /home/i }));
  expect(screen.getByText("Home page content")).toBeTruthy();
});
