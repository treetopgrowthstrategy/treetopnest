import { test, expect } from '@playwright/test';

test.describe('Pricing page structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-cmo-advisor/pricing');
  });

  test('all five tier cards are present', async ({ page }) => {
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(5);

    await expect(page.locator('.card h3:has-text("Free Snapshot")')).toBeVisible();
    await expect(page.locator('.card h3:has-text("Full Report")')).toBeVisible();
    await expect(page.locator('.card h3:has-text("Monitor")')).toBeVisible();
    await expect(page.locator('.card h3:has-text("Guided")')).toBeVisible();
    await expect(page.locator('.card h3:has-text("Embedded")')).toBeVisible();
  });

  test('tier prices are correct', async ({ page }) => {
    await expect(page.locator('.card').filter({ has: page.locator('h3', { hasText: 'Free Snapshot' }) }).locator('.price')).toContainText('Free');
    await expect(page.locator('.card').filter({ has: page.locator('h3', { hasText: 'Full Report' }) }).locator('.price')).toContainText('$99');
    await expect(page.locator('.card').filter({ has: page.locator('h3', { hasText: 'Monitor' }) }).locator('.price')).toContainText('$249');
    await expect(page.locator('.card').filter({ has: page.locator('h3', { hasText: 'Guided' }) }).locator('.price')).toContainText('$999');
    await expect(page.locator('.card').filter({ has: page.locator('h3', { hasText: 'Embedded' }) }).locator('.price')).toContainText('$2,500');
  });

  test('Monitor card is featured with badge', async ({ page }) => {
    const monitorCard = page.locator('.card.feature');
    await expect(monitorCard).toHaveCount(1);
    await expect(monitorCard.locator('.badge')).toContainText('Most popular');
    await expect(monitorCard.locator('h3')).toContainText('Monitor');
  });

  test('comparison table has correct rows', async ({ page }) => {
    const table = page.locator('table.cmp');
    await expect(table).toBeVisible();

    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(6);

    await expect(rows.nth(0)).toContainText('Price');
    await expect(rows.nth(1)).toContainText('Live data');
    await expect(rows.nth(2)).toContainText('Competitors tracked');
    await expect(rows.nth(3)).toContainText('Human judgment');
    await expect(rows.nth(4)).toContainText('Execution');
    await expect(rows.nth(5)).toContainText('Domains');
  });

  test('FAQ accordions expand and collapse', async ({ page }) => {
    const firstQ = page.locator('.qa details').first();
    const answer = firstQ.locator('p');

    await expect(answer).not.toBeVisible();
    await firstQ.locator('summary').click();
    await expect(answer).toBeVisible();
    await firstQ.locator('summary').click();
    await expect(answer).not.toBeVisible();
  });

  test('JSON-LD schema has product offers', async ({ page }) => {
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(ld).toBeTruthy();
    const parsed = JSON.parse(ld!);
    const graph = parsed['@graph'];
    const product = graph.find((n: any) => n['@type'] === 'Product');
    expect(product).toBeTruthy();
    expect(product.offers).toHaveLength(5);
    expect(product.offers.map((o: any) => o.price)).toEqual(['0', '99', '249', '999', '2500']);
  });

  test('free snapshot CTA links to /ai-cmo-advisor/free', async ({ page }) => {
    const freeLinks = page.locator('a[href="/ai-cmo-advisor/free"]');
    expect(await freeLinks.count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Sample report page', () => {
  test('loads with all 6 report sections', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/ai-cmo-advisor/sample-report');
    await expect(page).toHaveTitle(/Sample AI CMO Report/i);

    const sections = page.locator('.report-h2');
    await expect(sections).toHaveCount(6);

    await expect(sections.nth(0)).toContainText('Competitive Snapshot');
    await expect(sections.nth(1)).toContainText('Keyword Gap');
    await expect(sections.nth(2)).toContainText('Content Positioning');
    await expect(sections.nth(3)).toContainText('Growth Levers');
    await expect(sections.nth(4)).toContainText('90-Day Roadmap');
    await expect(sections.nth(5)).toContainText('What I Would Do First');

    expect(errors).toEqual([]);
  });

  test('has KPI row with domain ratings', async ({ page }) => {
    await page.goto('/ai-cmo-advisor/sample-report');
    const kpis = page.locator('.kpi');
    await expect(kpis).toHaveCount(3);
    await expect(kpis.first()).toContainText('24');
    await expect(kpis.first()).toContainText('Fieldline');
  });

  test('CTA links to AI CMO advisor', async ({ page }) => {
    await page.goto('/ai-cmo-advisor/sample-report');
    const ctaLink = page.locator('.cta-box a.btn-p');
    await expect(ctaLink).toHaveAttribute('href', '/ai-cmo-advisor');
  });

  test('has proper meta tags for SEO', async ({ page }) => {
    await page.goto('/ai-cmo-advisor/sample-report');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://treetopgrowthstrategy.com/ai-cmo-advisor/sample-report');
  });
});

test.describe('Onboarding page', () => {
  test('shows invalid access without email param', async ({ page }) => {
    await page.goto('/ai-cmo-advisor/onboarding');
    await expect(page.locator('#step-invalid')).toBeVisible();
    await expect(page.locator('#step-0')).not.toBeVisible();
  });

  test('shows step 1 with valid email param', async ({ page }) => {
    const email = Buffer.from('test@example.com').toString('base64url');
    await page.goto(`/ai-cmo-advisor/onboarding?e=${email}`);

    await expect(page.locator('#step-0')).toBeVisible();
    await expect(page.locator('#step-invalid')).not.toBeVisible();
    await expect(page.locator('#verified-email')).toContainText('test@example.com');
  });

  test('step 1 requires business description', async ({ page }) => {
    const email = Buffer.from('test@example.com').toString('base64url');
    await page.goto(`/ai-cmo-advisor/onboarding?e=${email}`);

    await page.locator('#step-0 .btn-p').click();
    await expect(page.locator('#err-0')).toBeVisible();
    await expect(page.locator('#step-0')).toBeVisible();
  });

  test('navigates forward and back through steps', async ({ page }) => {
    const email = Buffer.from('test@example.com').toString('base64url');
    await page.goto(`/ai-cmo-advisor/onboarding?e=${email}`);

    await page.locator('#q1').fill('We sell software to restaurants.');
    await page.locator('#step-0 .btn-p').click();
    await expect(page.locator('#step-1')).toBeVisible();

    await page.locator('#step-1 .btn-back').click();
    await expect(page.locator('#step-0')).toBeVisible();
  });

  test('step 3 requires competitors', async ({ page }) => {
    const email = Buffer.from('test@example.com').toString('base64url');
    await page.goto(`/ai-cmo-advisor/onboarding?e=${email}`);

    await page.locator('#q1').fill('SaaS for gyms');
    await page.locator('#step-0 .btn-p').click();
    await expect(page.locator('#step-1')).toBeVisible();

    await page.locator('#step-1 .btn-p').click();
    await expect(page.locator('#step-2')).toBeVisible();

    await page.locator('#step-2 .btn-p').click();
    await expect(page.locator('#err-2')).toBeVisible();
  });

  test('progress dots advance with steps', async ({ page }) => {
    const email = Buffer.from('test@example.com').toString('base64url');
    await page.goto(`/ai-cmo-advisor/onboarding?e=${email}`);

    await expect(page.locator('#dot-0')).toHaveClass(/active/);

    await page.locator('#q1').fill('SaaS');
    await page.locator('#step-0 .btn-p').click();
    await expect(page.locator('#step-1')).toBeVisible();

    await expect(page.locator('#dot-0')).toHaveClass(/done/);
    await expect(page.locator('#dot-1')).toHaveClass(/active/);
  });

  test('submit sends complete onboarding data', async ({ page }) => {
    let captured: any = null;
    await page.route('**/api/cmo-onboard', async (route) => {
      captured = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    const email = Buffer.from('test@example.com').toString('base64url');
    await page.goto(`/ai-cmo-advisor/onboarding?e=${email}`);

    await page.locator('#q1').fill('We sell CRM software to gyms.');
    await page.locator('#step-0 .btn-p').click();

    await page.locator('#step-1 .btn-p').click();

    await page.locator('#q3').fill('Mindbody, Zen Planner');
    await page.locator('#step-2 .btn-p').click();

    await page.locator('#step-3 .btn-p').click();
    await page.locator('#step-4 .btn-p').click();
    await page.locator('#step-5 .btn-p').click();

    await page.locator('#submit-btn').click();
    await expect(page.locator('#step-success')).toBeVisible({ timeout: 5000 });

    expect(captured).toBeTruthy();
    expect(captured.email).toBe('test@example.com');
    expect(captured.q1).toBe('We sell CRM software to gyms.');
    expect(captured.q3).toBe('Mindbody, Zen Planner');
  });
});
