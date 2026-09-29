// Accounts created by Backend/scripts/sql/seed_e2e_users.sql (password Test1234!)
export const PASSWORD = 'Test1234!';

export async function login(page, email, password = PASSWORD) {
  await page.goto('/login');
  await page.fill('#username', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
}
