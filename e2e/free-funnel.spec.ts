import { test, expect } from '@playwright/test';

test.describe('Free funnel form flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-cmo-advisor/free');
  });

  test('step 1 rejects email without @', async ({ page }) => {
    await page.locator('#s1-email').fill('not-an-email');
    await page.locator('#s1-website').fill('example.com');
    await page.locator('#s1-btn').click();

    await expect(page.locator('#s1-err')).toBeVisible();
    await expect(page.locator('#s1-err')).toContainText('valid');
    await expect(page.locator('#step-2')).not.toBeVisible();
  });

  test('step 1 allows submit without website', async ({ page }) => {
    await page.route('**/api/cmo-free-start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );

    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-btn').click();

    await expect(page.locator('#step-2')).toBeVisible({ timeout: 5000 });
  });

  test('step 1 transitions to step 2 on success', async ({ page }) => {
    await page.route('**/api/cmo-free-start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );

    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-website').fill('example.com');
    await page.locator('#s1-btn').click();

    await expect(page.locator('#step-1')).not.toBeVisible();
    await expect(page.locator('#step-2')).toBeVisible();
    await expect(page.locator('#s2-linkedin')).toBeVisible();
    await expect(page.locator('#s2-btn')).toBeVisible();
  });

  test('step 1 sends correct POST body', async ({ page }) => {
    let captured: any = null;
    await page.route('**/api/cmo-free-start', async (route) => {
      captured = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.locator('#s1-email').fill('jane@acme.co');
    await page.locator('#s1-website').fill('acme.co');
    await page.locator('#s1-btn').click();

    await expect(page.locator('#step-2')).toBeVisible({ timeout: 5000 });
    expect(captured).toBeTruthy();
    expect(captured.email).toBe('jane@acme.co');
    expect(captured.website).toBe('acme.co');
    expect(captured.hp).toBe('');
    expect(captured._t).toEqual(expect.any(Number));
  });

  test('step 1 button disables during submission', async ({ page }) => {
    await page.route('**/api/cmo-free-start', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-website').fill('example.com');
    await page.locator('#s1-btn').click();

    await expect(page.locator('#s1-btn')).toBeDisabled();
  });

  test('step 1 re-enables button on network error', async ({ page }) => {
    await page.route('**/api/cmo-free-start', (route) => route.abort());

    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-website').fill('example.com');
    await page.locator('#s1-btn').click();

    await expect(page.locator('#s1-err')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#s1-btn')).toBeEnabled();
  });

  test('honeypot field exists and is off-screen', async ({ page }) => {
    const hp = page.locator('#hp-1');
    await expect(hp).toHaveCount(1);
    const box = await hp.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeLessThan(0);
  });

  test('step 2 rejects empty LinkedIn', async ({ page }) => {
    await page.route('**/api/cmo-free-start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-btn').click();
    await expect(page.locator('#step-2')).toBeVisible({ timeout: 5000 });

    await page.locator('#s2-btn').click();

    await expect(page.locator('#s2-err')).toBeVisible();
    await expect(page.locator('#s2-err')).toContainText('LinkedIn');
  });

  test('step 2 rejects non-LinkedIn URL', async ({ page }) => {
    await page.route('**/api/cmo-free-start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-btn').click();
    await expect(page.locator('#step-2')).toBeVisible({ timeout: 5000 });

    await page.locator('#s2-linkedin').fill('https://twitter.com/someone');
    await page.locator('#s2-btn').click();

    await expect(page.locator('#s2-err')).toBeVisible();
    await expect(page.locator('#s2-err')).toContainText('LinkedIn');
  });

  test('step 2 transitions to success on valid response', async ({ page }) => {
    await page.route('**/api/cmo-free-start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.route('**/api/cmo-free-qualify', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    );

    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-btn').click();
    await expect(page.locator('#step-2')).toBeVisible({ timeout: 5000 });

    await page.locator('#s2-linkedin').fill('https://linkedin.com/in/testuser');
    await page.locator('#s2-btn').click();

    await expect(page.locator('#step-done')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#step-2')).not.toBeVisible();
  });

  test('step 2 sends email from step 1 in POST body', async ({ page }) => {
    let captured: any = null;
    await page.route('**/api/cmo-free-start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.route('**/api/cmo-free-qualify', async (route) => {
      captured = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });

    await page.locator('#s1-email').fill('jane@acme.co');
    await page.locator('#s1-btn').click();
    await expect(page.locator('#step-2')).toBeVisible({ timeout: 5000 });

    await page.locator('#s2-linkedin').fill('https://linkedin.com/in/jane');
    await page.locator('#s2-btn').click();
    await expect(page.locator('#step-done')).toBeVisible({ timeout: 5000 });

    expect(captured).toBeTruthy();
    expect(captured.email).toBe('jane@acme.co');
    expect(captured.linkedin).toBe('https://linkedin.com/in/jane');
  });

  test('step 2 shows custom success message when returned', async ({ page }) => {
    await page.route('**/api/cmo-free-start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.route('**/api/cmo-free-qualify', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"success":true,"message":"Custom message here."}',
      })
    );

    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-btn').click();
    await expect(page.locator('#step-2')).toBeVisible({ timeout: 5000 });

    await page.locator('#s2-linkedin').fill('https://linkedin.com/in/test');
    await page.locator('#s2-btn').click();
    await expect(page.locator('#step-done')).toBeVisible({ timeout: 5000 });

    await expect(page.locator('#done-msg')).toContainText('Custom message here.');
  });

  test('step 2 shows error on non-success API response', async ({ page }) => {
    await page.route('**/api/cmo-free-start', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.route('**/api/cmo-free-qualify', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: '{"success":false,"error":"bad request"}',
      })
    );

    await page.locator('#s1-email').fill('test@example.com');
    await page.locator('#s1-btn').click();
    await expect(page.locator('#step-2')).toBeVisible({ timeout: 5000 });

    await page.locator('#s2-linkedin').fill('https://linkedin.com/in/test');
    await page.locator('#s2-btn').click();

    await expect(page.locator('#s2-err')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#s2-err')).toContainText('bad request');
    await expect(page.locator('#s2-btn')).toBeEnabled();
  });
});
