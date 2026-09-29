import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Quality Service', () => {
  test('should navigate quality pages', async ({ page }) => {
    await login(page, 'qualite@ebi.com');
    await page.waitForURL(/qualite\/dashboard/);

    for (const [link, url] of [
      ["Fiche d'Évaluation", /qualite\/evaluation/],
      ['Stats appels', /qualite\/stats-appels/],
      ['Calendrier RDV pipeline', /qualite\/calendrier/],
    ]) {
      await page.click(`a:has-text("${link}")`);
      await expect(page).toHaveURL(url);
    }
  });
});
