import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Quality Dashboard', () => {
  test('should access quality dashboard as qualite', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('#username', 'qualite');
    await page.fill('#password', 'qualite');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/qualite\/dashboard/);
  });

  test('should navigate quality pages', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('#username', 'qualite');
    await page.fill('#password', 'qualite');
    await page.click('button[type="submit"]');
    await page.waitForURL(/qualite\/dashboard/);

    const links = ['Fiche d\'Évaluation', 'Performance', 'Comparaison'];
    for (const link of links) {
      const locator = page.locator(`a:has-text("${link}")`);
      if (await locator.isVisible()) {
        await locator.click();
        await page.waitForTimeout(1000);
        await page.goBack();
      }
    }
  });
});