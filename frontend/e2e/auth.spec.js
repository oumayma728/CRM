import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await login(page, 'admin@ebi.com');
    await expect(page).toHaveURL(/admin\/realtime/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await login(page, 'admin@ebi.com', 'wrong-password');
    await expect(page.getByText(/email ou mot de passe incorrect/i).first()).toBeVisible();
  });

  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});

// Every role lands on its own dashboard with its own sidebar
const LANDINGS = [
  ['superadmin@ebi.com', /superadmin\/dashboard/],
  ['admin@ebi.com', /admin\/realtime/],
  ['agent@ebi.com', /agent\/dashboard/],
  ['qualite@ebi.com', /qualite\/dashboard/],
  ['conf1@ebi.com', /confirmation1\/dashboard/],
  ['conf2@ebi.com', /confirmation2\/dashboard/],
  ['confclient@ebi.com', /confirmation-client\/dashboard/],
  ['commercial@ebi.com', /commercial\/dashboard/],
  ['tech@ebi.com', /technique\/dashboard/],
];

test.describe('Role landing pages', () => {
  for (const [email, url] of LANDINGS) {
    test(`${email} lands on its dashboard`, async ({ page }) => {
      await login(page, email);
      await expect(page).toHaveURL(url);
      await expect(page.locator('nav a').first()).toBeVisible();
    });
  }

  test('a confirmatrice cannot open admin pages', async ({ page }) => {
    await login(page, 'conf1@ebi.com');
    await page.waitForURL(/confirmation1\/dashboard/);
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/confirmation1\/dashboard/);
  });
});
