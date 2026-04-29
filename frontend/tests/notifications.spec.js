import { test, expect } from '@playwright/test';
import crypto from 'crypto';

/**
 * Utility to sign a JWT with HS256 using the backend's secret.
 * This allows the test to authenticate as a real user in the backend.
 */
function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const part1 = encode(header);
  const part2 = encode(payload);

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${part1}.${part2}`)
    .digest('base64url');

  return `${part1}.${part2}.${signature}`;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Create frontend/.env.test (or set it in CI) to run this test.`,
    );
  }
  return value;
}

const JWT_SECRET = requiredEnv('TEST_JWT_SECRET');

test.describe('Notifications page (E2E with Backend)', () => {
  const TEST_USER = {
    email: requiredEnv('TEST_USER_EMAIL'),
    id: requiredEnv('TEST_USER_ID'),
    name: requiredEnv('TEST_USER_NAME'),
    role: process.env.TEST_USER_ROLE || 'USER',
  };

  test.beforeEach(async ({ page }) => {
    const token = signJwt(
      {
        sub: TEST_USER.email,
        id: TEST_USER.id,
        name: TEST_USER.name,
        role: TEST_USER.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
      JWT_SECRET,
    );

    await page.addInitScript((t) => {
      window.localStorage.setItem('token', t);
    }, token);

    // We do NOT mock /api/notifications here.
    // The app will call the real backend via the Vite proxy.
  });

  test('renders real notifications from backend and marks them as read', async ({
    page,
  }) => {
    // 1. Visit the page
    await page.goto('/notifications');

    // 2. Ensure we have at least one notification by calling the backend's test endpoint
    // We do this via the page context so it uses the token in localStorage
    const createdNotification = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      // Ensure preferences allow the TICKET notification to be created
      await fetch('/api/notifications/preferences?category=TICKET&emailEnabled=true&inAppEnabled=true', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await fetch('/api/notifications/test', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    });

    // 3. Reload to see the new notification
    await page.reload();

    // 4. Verify the notification appears (the test endpoint uses "Test Notification")
    const createdMessage = createdNotification?.message || 'Test Notification';
    const createdMessageText = page.getByText(createdMessage).first();
    await expect(createdMessageText).toBeVisible({ timeout: 15000 });
    const testNotificationRow = createdMessageText.locator(
      'xpath=ancestor::div[contains(@class,"group")][1]',
    );

    // 5. Test filtering to 'Unread'
    await page.getByRole('button', { name: 'Unread' }).click();
    await expect(createdMessageText).toBeVisible({ timeout: 15000 });

    // 6. Test 'Mark as read'
    const markReadButton = testNotificationRow.getByRole('button', { name: 'Mark as read' });

    await testNotificationRow.scrollIntoViewIfNeeded();
    await testNotificationRow.hover();
    await expect(markReadButton).toBeVisible({ timeout: 15000 });
    const markReadResponsePromise = page.waitForResponse((res) => {
      const url = res.url();
      return (
        res.request().method() === 'PATCH' &&
        url.includes('/api/notifications/') &&
        url.endsWith('/read')
      );
    });
    await markReadButton.click();
    const markReadResponse = await markReadResponsePromise;
    expect(markReadResponse.ok()).toBeTruthy();

    // 7. Verify the count decreased (disappears from 'Unread' list)
    await page.reload();
    await page.getByRole('button', { name: 'Unread' }).click();
    await expect(page.getByText(createdMessage)).toHaveCount(0, { timeout: 15000 });
  });

  test('shows real empty state when no notifications exist', async ({
    page,
  }) => {
   
    await page.goto('/notifications');
    await expect(
      page.getByRole('heading', { name: 'Notifications' }),
    ).toBeVisible();
  });
});
