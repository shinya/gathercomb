import { test, expect } from '@playwright/test';

test.describe('Board', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    // Visit the board list page (root) without being logged in.
    // The app checks for a null user and navigates to /login.
    await page.goto('/');

    // After the redirect we should land on the login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2')).toHaveText('Login');
  });

  test('board list page loads after login', async ({ page }) => {
    // This test demonstrates the intended post-login flow.
    // We mock the backend auth endpoints so no real server is needed.

    // Mock GET /api/auth/me to return a valid user (simulates an active session)
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      })
    );

    // Mock GET /api/boards to return an empty board list
    await page.route('**/api/boards', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/');

    // An authenticated user should see the board list heading and welcome text
    await expect(page.locator('h1')).toHaveText('My Boards');
    await expect(page.getByText('Welcome, Test User')).toBeVisible();

    // The empty-state message should be visible since there are no boards
    await expect(
      page.getByText('No boards yet. Create your first board to get started!')
    ).toBeVisible();
  });
});
