import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin\//);
  });

  test('should view admin dashboard', async ({ page }) => {
    await expect(page.locator('nav', { hasText: 'PRINCIPAL' })).toBeVisible();
  });

  test('should navigate to agents page', async ({ page }) => {
    await page.click('a:has-text("Gestion des agents"), button:has-text("Gestion des agents")');
    await expect(page).toHaveURL(/agents/);
  });

  test('should navigate to salaries page', async ({ page }) => {
    await page.click('a:has-text("Salaires"), button:has-text("Salaires")');
    await expect(page).toHaveURL(/salaires|salaries|salary/);
  });

  test('should navigate to scoring and alerts page', async ({ page }) => {
    await page.click('a:has-text("Alertes & Scoring"), button:has-text("Alertes & Scoring")');
    await expect(page).toHaveURL(/scoring|alertes|alerts/);
  });

  test('should display sidebar with navigation links', async ({ page }) => {
    const sidebar = page.locator('nav', { hasText: 'PRINCIPAL' });
    await expect(sidebar).toBeVisible();
    const links = await sidebar.locator('a, button').count();
    expect(links).toBeGreaterThan(5);
  });
});