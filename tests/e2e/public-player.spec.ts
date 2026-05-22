import { expect, test } from "@playwright/test";

test("public visitor can open and complete a scenario", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /public scenario library/i })).toBeVisible();
  await page.getByRole("link", { name: /checking before acting/i }).click();
  await expect(page.getByRole("link", { name: /start scenario/i })).toBeVisible();

  await page.getByRole("link", { name: /start scenario/i }).click();
  await expect(page.getByRole("heading", { name: /a message arrives/i })).toBeVisible();
  await page.getByRole("button", { name: /check with a trusted source first/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();

  await expect(page.getByText(/scenario complete/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /replay/i })).toBeVisible();
});
