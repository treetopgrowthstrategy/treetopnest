import { test, expect } from '@playwright/test';

test.describe('Static page smoke tests', () => {
  test('homepage loads and has key elements', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await expect(page).toHaveTitle(/Treetop/i);

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('pricing page loads with tier cards', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/ai-cmo-advisor/pricing');
    await expect(page).toHaveTitle(/pricing/i);

    await expect(page.getByText('$99 one time')).toBeVisible();
    await expect(page.getByText('$249/month')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('free snapshot page loads with form', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/ai-cmo-advisor/free');
    await expect(page).toHaveTitle(/Free Competitive Snapshot/i);

    const emailInput = page.locator('#s1-email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');

    const websiteInput = page.locator('#s1-website');
    await expect(websiteInput).toBeVisible();

    const submitBtn = page.locator('#s1-btn');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    expect(errors).toEqual([]);
  });

  test('free page client-side validation rejects empty email', async ({ page }) => {
    await page.goto('/ai-cmo-advisor/free');

    await page.locator('#s1-btn').click();

    const errEl = page.locator('#s1-err');
    await expect(errEl).toBeVisible();
    await expect(errEl).toContainText('valid');
  });

  test('free page form step 1 posts to correct endpoint', async ({ page }) => {
    await page.goto('/ai-cmo-advisor/free');

    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-website').fill('example.com');

    const [request] = await Promise.all([
      page.waitForRequest((req) =>
        req.url().includes('/api/cmo-free-start') && req.method() === 'POST'
      ),
      page.locator('#s1-btn').click(),
    ]);

    const body = request.postDataJSON();
    expect(body.email).toBe('test@example.com');
    expect(body.website).toBe('example.com');
  });

  test('pricing page CTA links resolve', async ({ page }) => {
    await page.goto('/ai-cmo-advisor/pricing');

    const freeLink = page.getByRole('link', { name: /free/i }).first();
    if (await freeLink.count()) {
      const href = await freeLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('confirmed page loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/ai-cmo-advisor/confirmed');
    expect(errors).toEqual([]);
  });
});
