import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@ebi.com');
    await page.waitForURL(/admin\//);
  });

  test('should display sidebar with navigation links', async ({ page }) => {
    const sidebar = page.locator('nav', { hasText: 'PRINCIPAL' });
    await expect(sidebar).toBeVisible();
    expect(await sidebar.locator('a').count()).toBeGreaterThan(20);
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.click('a:has-text("Gestion des agents")');
    await expect(page).toHaveURL(/admin\/agents/);
  });

  test('should navigate to salaries page', async ({ page }) => {
    await page.click('a:has-text("Salaires")');
    await expect(page).toHaveURL(/admin\/salaries/);
  });

  test('should open the user management and campaign file pages', async ({ page }) => {
    await page.click('a:has-text("Utilisateurs")');
    await expect(page.getByText('Gestion des Utilisateurs')).toBeVisible();
    await page.click('a:has-text("Gestion fichiers")');
    await expect(page).toHaveURL(/admin\/injection/);
  });
});
