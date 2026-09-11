import { test, expect } from '@playwright/test';

test.describe('Attendance Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'sana.b');
    await page.fill('#password', 'agent');
    await page.click('button[type="submit"]');
    await page.waitForURL(/agent\/dashboard/);
  });

  test('should show clock-in button on dashboard', async ({ page }) => {
    await expect(page.locator('button:has-text("Pointer")')).toBeVisible();
  });

  test('should navigate to performance page', async ({ page }) => {
    await page.click('a:has-text("Performance"), button:has-text("Performance")');
    await expect(page).toHaveURL(/performance/);
  });

  test('should navigate to agenda', async ({ page }) => {
    await page.click('a:has-text("Agenda"), button:has-text("Agenda")');
    await expect(page).toHaveURL(/agenda/);
  });
});