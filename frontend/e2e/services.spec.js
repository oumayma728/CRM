import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Confirmation, commercial and technical services', () => {
  test('confirmatrice client can open the RDV attribution page', async ({ page }) => {
    await login(page, 'confclient@ebi.com');
    await page.waitForURL(/confirmation-client\/dashboard/);
    await page.click('a:has-text("Attribution RDV")');
    await expect(page).toHaveURL(/confirmation-client\/attribution/);
  });

  test('commercial sees its agenda', async ({ page }) => {
    await login(page, 'commercial@ebi.com');
    await page.waitForURL(/commercial\/dashboard/);
    await page.click('a:has-text("Mon agenda")');
    await expect(page).toHaveURL(/commercial\/agenda/);
  });

  test('technical service sees the agents list', async ({ page }) => {
    await login(page, 'tech@ebi.com');
    await page.waitForURL(/technique\/dashboard/);
    await page.click('nav a:has-text("Liste des agents")');
    await expect(page).toHaveURL(/technique\/agents/);
  });
});
