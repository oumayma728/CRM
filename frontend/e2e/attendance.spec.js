import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Agent Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'agent@ebi.com');
    await page.waitForURL(/agent\/dashboard/);
  });

  test('should show clock-in button', async ({ page }) => {
    await expect(page.locator('button:has-text("Pointer")').first()).toBeVisible();
  });

  test('should navigate to performance page', async ({ page }) => {
    await page.click('a:has-text("Performance")');
    await expect(page).toHaveURL(/performance/);
  });

  test('should open the campaign dialer and pipeline agenda', async ({ page }) => {
    await page.click('a:has-text("Dialer campagne")');
    await expect(page).toHaveURL(/agent\/dialer/);
    await page.click('a:has-text("Mes RDV (pipeline)")');
    await expect(page).toHaveURL(/agent\/mes-rdv/);
  });
});
