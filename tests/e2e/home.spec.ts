import { expect, test } from "@playwright/test";

test("shows the public scenario library", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Public Scenario Library" })).toBeVisible();
});
