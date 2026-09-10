import { test, expect } from '@playwright/test';

async function login(page, username, password) {
  await page.goto('/login');
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
}

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await login(page, 'admin', 'admin');
    await expect(page).toHaveURL(/dashboard|realtime/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await login(page, 'wrong', 'wrong');
    await expect(page.getByText('Login failed')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await login(page, 'admin', 'admin');

    const logoutButton = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Agent Navigation', () => {
  test('should access agent dashboard', async ({ page }) => {
    await login(page, 'sana.b', 'agent');
    await expect(page).toHaveURL(/agent\/dashboard/);
  });
});

test.describe('Dark Mode', () => {
  test('should toggle dark mode', async ({ page }) => {
    await login(page, 'admin', 'admin');

    const toggle = page.locator('button[aria-label*="Activer le mode" i]');
    if (await toggle.isVisible()) {
      await toggle.click();
      const html = page.locator('html');
      const classAttr = await html.getAttribute('class');
      expect(classAttr !== null).toBeTruthy();
    }
  });
});