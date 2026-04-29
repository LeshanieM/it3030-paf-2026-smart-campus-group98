import { test, expect } from '@playwright/test';
import crypto from 'crypto';

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
    throw new Error(`Missing required env var ${name}`);
  }

  return value;
}

const JWT_SECRET = requiredEnv('TEST_JWT_SECRET');

test.describe('Incident & Maintenance Ticketing', () => {
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

  test('Positive: Maintenance dashboard loads successfully', async ({ page }) => {
    await page.goto('/maintenance');

    await expect(
      page.getByRole('heading', {
        name: /incident ticketing and maintenance dashboard/i,
      }),
    ).toBeVisible({ timeout: 25000 });

    await expect(page.getByText(/student and staff portal/i)).toBeVisible();

    await expect(
      page.getByRole('button', { name: /refresh data/i }),
    ).toBeVisible();
  });

  test('Positive: Sidebar/navigation area is visible', async ({ page }) => {
    await page.goto('/maintenance');

    await expect(
      page.getByRole('heading', {
        name: /incident ticketing and maintenance dashboard/i,
      }),
    ).toBeVisible({ timeout: 25000 });

    await expect(page.getByText(/facility flow/i).first()).toBeVisible();
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
    await expect(page.getByText(/incident ticketing/i).first()).toBeVisible();
  });

  test('Positive: User profile and logout area is visible', async ({ page }) => {
    await page.goto('/maintenance');

    await expect(
      page.getByRole('heading', {
        name: /incident ticketing and maintenance dashboard/i,
      }),
    ).toBeVisible({ timeout: 25000 });

    await expect(page.getByText(/view profile/i)).toBeVisible();
    await expect(page.getByText(/logout/i)).toBeVisible();
  });
});