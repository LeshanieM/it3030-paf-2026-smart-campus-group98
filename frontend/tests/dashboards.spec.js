import { test, expect } from '@playwright/test';
import crypto from 'crypto';

/**
 * Utility to sign a JWT with HS256 using the backend's secret.
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
    throw new Error(`Missing required env var ${name}.`);
  }
  return value;
}

const JWT_SECRET = requiredEnv('TEST_JWT_SECRET');

test.describe('User Dashboards', () => {
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
  });

  test('Positive: User can view their main dashboard with service activity', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify welcome message (using partial name from env)
    const firstName = TEST_USER.name.split(' ')[0];
    await expect(page.getByRole('heading', { name: new RegExp(`Welcome,.*${firstName}`, 'i') })).toBeVisible({ timeout: 15000 });

    // Verify dashboard heading
    await expect(page.getByText('Your service activity at a glance')).toBeVisible();

    // Verify KPI cards are present
    await expect(page.getByText('Total Requests').first()).toBeVisible();
    await expect(page.getByText('Active Bookings').first()).toBeVisible();

    // Verify Quick Actions section
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Submit New Incident Ticket' })).toBeVisible();
  });
});
