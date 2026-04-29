import { test, expect } from "@playwright/test";
import crypto from "crypto";

function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const part1 = encode(header);
  const part2 = encode(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${part1}.${part2}`)
    .digest("base64url");

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

const JWT_SECRET = requiredEnv("TEST_JWT_SECRET");
const ADMIN_USER = {
  email: process.env.TEST_ADMIN_EMAIL || requiredEnv("TEST_USER_EMAIL"),
  id: process.env.TEST_ADMIN_ID || requiredEnv("TEST_USER_ID"),
  name: process.env.TEST_ADMIN_NAME || requiredEnv("TEST_USER_NAME"),
  role: process.env.TEST_ADMIN_ROLE || "ADMIN",
};

test.describe("Admin facilities page", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/user/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: ADMIN_USER.id,
          email: ADMIN_USER.email,
          name: ADMIN_USER.name,
          role: ADMIN_USER.role,
        }),
      });
    });

    const token = signJwt(
      {
        sub: ADMIN_USER.email,
        id: ADMIN_USER.id,
        name: ADMIN_USER.name,
        role: ADMIN_USER.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
      JWT_SECRET,
    );

    await page.addInitScript((t) => {
      window.localStorage.setItem("token", t);
    }, token);
  });

  test("positive: renders admin facility management page", async ({ page }) => {
    await page.goto("/admin/facilities");

    await expect(
      page.getByRole("heading", { name: "Manage Facilities" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add New Facility" }),
    ).toBeVisible();
  });

  test("positive: creates facility and toggles status", async ({ page }) => {
    const facilityName = `PW Facility ${Date.now()}`;
    const mockResources = [
      {
        id: 1,
        name: "Existing Facility",
        type: "LECTURE_HALL",
        capacity: 80,
        location: "Block A",
        description: "Seed data",
        availabilityWindows: [],
        amenities: [],
        imageUrl: "",
        status: "ACTIVE",
        rating: 0,
        numReviews: 0,
      },
    ];

    await page.route("**/admin/resources", async (route) => {
      const req = route.request();
      const method = req.method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockResources),
        });
        return;
      }

      if (method === "POST") {
        const payload = req.postDataJSON();
        const created = {
          id: Date.now(),
          ...payload,
          status: "ACTIVE",
          rating: 0,
          numReviews: 0,
        };
        mockResources.unshift(created);

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(created),
        });
        return;
      }

      await route.fallback();
    });

    await page.route("**/admin/resources/*/status**", async (route) => {
      const reqUrl = new URL(route.request().url());
      const newStatus = reqUrl.searchParams.get("status") || "OUT_OF_SERVICE";
      const idFromPath = Number(reqUrl.pathname.split("/").slice(-2, -1)[0]);
      const target = mockResources.find((r) => r.id === idFromPath);
      if (target) target.status = newStatus;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(target || {}),
      });
    });

    await page.goto("/admin/facilities");
    await page.getByRole("button", { name: "Add New Facility" }).click();

    await page.locator('input[name="name"]').fill(facilityName);
    await page.locator('input[name="location"]').fill("Block Z, Level 1");
    await page.locator('input[name="capacity"]').fill("25");
    await page
      .locator('textarea[name="description"]')
      .fill("Created by Playwright E2E test");

    await page.getByRole("button", { name: "Create Facility" }).click();

    await expect(page.getByText("Facility successfully created.")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(facilityName).first()).toBeVisible({
      timeout: 15000,
    });

    const facilityCard = page
      .getByText(facilityName)
      .first()
      .locator('xpath=ancestor::div[contains(@class,"rounded-[22px]")][1]');

    await facilityCard.getByRole("button", { name: "SET OFFLINE" }).click();
    await expect(
      page.getByText("Facility status updated to", { exact: false }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      facilityCard.getByRole("button", { name: "SET ACTIVE" }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("negative: shows validation error for empty facility name", async ({
    page,
  }) => {
    await page.goto("/admin/facilities");
    await page.getByRole("button", { name: "Add New Facility" }).click();

    await page.locator('input[name="location"]').fill("Block A, Level 2");
    await page.locator('input[name="name"]').fill("   ");

    await page.getByRole("button", { name: "Create Facility" }).click();

    await expect(
      page.getByText("Facility name cannot be empty."),
    ).toBeVisible();
  });
});
