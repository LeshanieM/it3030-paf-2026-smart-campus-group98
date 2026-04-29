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
    throw new Error(
      `Missing required env var ${name}. Create frontend/.env.test (or set it in CI) to run this test.`,
    );
  }
  return value;
}

const JWT_SECRET = requiredEnv('TEST_JWT_SECRET');

test.describe('Create Booking Page', () => {
  const TEST_USER = {
    email: requiredEnv('TEST_USER_EMAIL'),
    id: requiredEnv('TEST_USER_ID'),
    name: requiredEnv('TEST_USER_NAME'),
    role: process.env.TEST_USER_ROLE || 'USER',
  };

  test.beforeEach(async ({ page }) => {
    // Generate token and add to localStorage
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

    // Mock resources for consistent testing
    await page.route('**/api/resources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'res-1', name: 'Conference Room A', type: 'ROOM', location: 'Block A, Level 2' },
          { id: 'res-2', name: 'MacBook Pro #1', type: 'EQUIPMENT', location: 'IT Lab' },
        ]),
      });
    });

    // Mock user me endpoint for layout/protected routes
    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_USER),
      });
    });

    // Mock notification count to avoid backend dependency and proxy errors
    await page.route('**/api/notifications/unread-count', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '0',
      });
    });

    // Mock logout to avoid redirect issues during teardown
    await page.route('**/api/user/logout', async (route) => {
      await route.fulfill({ status: 200 });
    });

    // Mock my bookings list to avoid 401 redirect when navigating after creation
    await page.route('**/api/bookings/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock WebSocket/SockJS to avoid connection timeouts
    await page.route('**/ws/**', async (route) => {
      await route.abort();
    });
  });

  test.setTimeout(60000); // Increase timeout to 60s for stability

  test('positive: creates a room booking successfully', async ({ page }) => {
    // Mock successful booking creation
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'booking-123', status: 'PENDING' }),
      });
    });

    await page.goto('/bookings/new');

    // Step 1: Resource Selection
    await page.selectOption('select', 'res-1');

    // Step 2: Date & Time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateStr);
    await page.fill('input[type="time"] >> nth=0', '10:00'); // Start Time
    await page.fill('input[type="time"] >> nth=1', '12:00'); // End Time

    // Step 3: Purpose & Attendees
    await page.fill('textarea', 'Research project meeting');
    await page.fill('input[type="number"]', '5');

    // Submit
    await page.click('button:has-text("Create Booking")');

    // Verification
    await expect(page.getByText('Booking created successfully!')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/bookings\/my/, { timeout: 15000 });
  });

  test('positive: creates an equipment booking successfully (attendees hidden)', async ({ page }) => {
    // Mock successful booking creation
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'booking-456', status: 'PENDING' }),
      });
    });

    await page.goto('/bookings/new');

    // Step 1: Select Equipment
    await page.selectOption('select', 'res-2');

    // Verify attendees field is hidden for equipment
    await expect(page.locator('label:has-text("Expected Attendees")')).not.toBeVisible();

    // Step 2: Date & Time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateStr);
    await page.fill('input[type="time"] >> nth=0', '14:00');
    await page.fill('input[type="time"] >> nth=1', '16:00');

    // Step 3: Purpose
    await page.fill('textarea', 'Video editing task');

    // Submit
    await page.click('button:has-text("Create Booking")');

    // Verification
    await expect(page.getByText('Booking created successfully!')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/bookings\/my/, { timeout: 15000 });
  });

  test('negative: shows validation error when end time is before start time', async ({ page }) => {
    await page.goto('/bookings/new');

    // Fill form with invalid time
    await page.selectOption('select', { index: 1 }); // Select any resource
    await page.fill('input[type="date"]', '2099-12-31'); // Far future date
    await page.fill('input[type="time"] >> nth=0', '14:00'); // Start
    await page.fill('input[type="time"] >> nth=1', '10:00'); // End (before start)
    await page.fill('textarea', 'Test purpose');

    // Submit
    await page.click('button:has-text("Create Booking")');

    // Verification
    await expect(page.getByText('End time must be after start time.')).toBeVisible();
    
    // Ensure we are still on the same page (not redirected)
    await expect(page).toHaveURL(/\/bookings\/new/);
  });
});
