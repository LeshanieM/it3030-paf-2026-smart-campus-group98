import { test, expect } from '@playwright/test';
import crypto from 'crypto';

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const part1 = encode(header);
  const part2 = encode(payload);
  const signature = crypto.createHmac('sha256', secret).update(`${part1}.${part2}`).digest('base64url');
  return `${part1}.${part2}.${signature}`;
}

const JWT_SECRET = process.env.TEST_JWT_SECRET || 'your-256-bit-secret';
const TEST_USER = {
  email: 'student@example.com',
  id: 'user-123',
  name: 'Student User',
  role: 'USER',
};

test.describe('Booking Actions (Delete/Cancel)', () => {
  test.beforeEach(async ({ page }) => {
    const token = signJwt({
      sub: TEST_USER.email,
      id: TEST_USER.id,
      name: TEST_USER.name,
      role: TEST_USER.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    }, JWT_SECRET);

    await page.addInitScript((t) => {
      window.localStorage.setItem('token', t);
    }, token);

    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_USER) });
    });

    await page.route('**/api/notifications/unread-count', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '0' });
    });
  });

  test('should show Delete button for PENDING booking and Cancel for APPROVED', async ({ page }) => {
    // Mock bookings list with one PENDING and one APPROVED
    await page.route('**/api/bookings/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { 
            id: 'b-pending', 
            resourceName: 'Lab A', 
            status: 'PENDING', 
            date: '2026-05-01', 
            startTime: '10:00', 
            endTime: '11:00' 
          },
          { 
            id: 'b-approved', 
            resourceName: 'Room B', 
            status: 'APPROVED', 
            date: '2026-05-01', 
            startTime: '12:00', 
            endTime: '13:00' 
          },
        ]),
      });
    });

    await page.goto('/bookings/my');

    // Verify Delete button for PENDING
    const pendingCard = page.locator('.group').filter({ hasText: 'Lab A' });
    await expect(pendingCard.getByText('Delete Request')).toBeVisible();
    await expect(pendingCard.getByText('Cancel Booking')).not.toBeVisible();

    // Verify Cancel button for APPROVED
    const approvedCard = page.locator('.group').filter({ hasText: 'Room B' });
    await expect(approvedCard.getByText('Cancel Booking')).toBeVisible();
    await expect(approvedCard.getByText('Delete Request')).not.toBeVisible();
  });

  test('should call delete endpoint when Delete Request is confirmed', async ({ page }) => {
    await page.route('**/api/bookings/my', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'b-pending', resourceName: 'Lab A', status: 'PENDING', date: '2026-05-01', startTime: '10:00', endTime: '11:00' },
          ]),
        });
      });

    let deleteCalled = false;
    await page.route('**/api/bookings/b-pending', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    await page.goto('/bookings/my');
    await page.click('button:has-text("Delete Request")');
    
    // Verify modal
    await expect(page.getByText('Delete Booking Request')).toBeVisible();
    await page.click('button:has-text("Yes, Delete It")');

    await expect(page.getByText('Booking request deleted.')).toBeVisible();
    expect(deleteCalled).toBe(true);
  });
});
