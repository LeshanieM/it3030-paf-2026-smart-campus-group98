import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('shows Google sign-in and redirects to OAuth endpoint', async ({ page }) => {
    await page.goto('/login');

    const googleButton = page.getByRole('button', { name: 'Sign in with Google' });
    await expect(googleButton).toBeVisible();

    const oauthRequest = page.waitForRequest((req) =>
      req.url().includes('/oauth2/authorization/google')
    );

    await googleButton.click();
    await oauthRequest;
  });

  test('displays branding and welcome message', async ({ page }) => {
    await page.goto('/login');

    // Check for branding
    await expect(page.getByText('CAMPUS', { exact: true })).toBeVisible();
    await expect(page.getByText('University Operations Portal')).toBeVisible();

    // Check for welcome message
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByText('Access your campus dashboard securely.')).toBeVisible();
  });
});

