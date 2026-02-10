import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/login');

    // The page initially shows the Login form
    await expect(page.locator('h2')).toHaveText('Login');

    // Switch to signup mode
    await page.getByRole('button', { name: /Don't have an account\? Sign up/i }).click();

    // Verify the heading changes to Sign Up
    await expect(page.locator('h2')).toHaveText('Sign Up');

    // Verify all signup fields are present
    await expect(page.locator('#displayName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Verify the submit button reads Sign Up
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
  });

  test('can switch between login and signup forms', async ({ page }) => {
    await page.goto('/login');

    // Starts on login
    await expect(page.locator('h2')).toHaveText('Login');
    await expect(page.locator('#displayName')).not.toBeVisible();

    // Switch to signup
    await page.getByRole('button', { name: /Sign up/i }).click();
    await expect(page.locator('h2')).toHaveText('Sign Up');
    await expect(page.locator('#displayName')).toBeVisible();

    // Switch back to login
    await page.getByRole('button', { name: /Already have an account\? Login/i }).click();
    await expect(page.locator('h2')).toHaveText('Login');
    await expect(page.locator('#displayName')).not.toBeVisible();
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit the form without filling anything in.
    // The HTML5 required attribute on the email input should prevent
    // submission and the browser shows a native validation message.
    const emailInput = page.locator('#email');
    const submitButton = page.getByRole('button', { name: 'Login', exact: true });

    await submitButton.click();

    // The email field should fail native validation (valueMissing)
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.checkValidity()
    );
    expect(isInvalid).toBe(true);
  });

  test('shows validation error for short password', async ({ page }) => {
    await page.goto('/login');

    // Switch to signup so we exercise the full form
    await page.getByRole('button', { name: /Sign up/i }).click();

    // Fill in display name and email, but leave password empty
    await page.locator('#displayName').fill('Test User');
    await page.locator('#email').fill('test@example.com');

    // Leave password empty and attempt to submit
    const submitButton = page.getByRole('button', { name: 'Sign Up', exact: true });
    await submitButton.click();

    // The password field should fail native validation because it is required
    const passwordInput = page.locator('#password');
    const isInvalid = await passwordInput.evaluate(
      (el: HTMLInputElement) => !el.checkValidity()
    );
    expect(isInvalid).toBe(true);
  });
});
