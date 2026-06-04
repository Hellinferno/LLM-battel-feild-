import { expect, test } from "@playwright/test";

test("renders the local benchmark workflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Compare outputs, tokens, and latency" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New benchmark" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Provider keys" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run comparison" })).toBeVisible();
  await expect(page.getByText("Unknown")).toHaveCount(0);
});

