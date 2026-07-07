import { test, expect, type Page } from '@playwright/test';

/**
 * Cross-tab SSE sync E2E test — the "real-time decision support" acceptance
 * criterion. Opens the home page in two browser contexts (simulating two
 * browser tabs on different roles), triggers an act in one, and verifies
 * the other tab sees the state change without a manual refresh.
 */

async function switchRole(page: Page, role: 'OPERATIONS' | 'SECURITY' | 'FAN') {
  await page.goto('/');
  // Open the role switcher
  const roleButton = page.getByRole('button', { name: /Active role:/i });
  await roleButton.click();
  // Click the matching menuitemradio
  const item = page.getByRole('menuitemradio', { name: new RegExp(`${role}\\s`) });
  await item.click();
  // Wait for the menu to close
  await expect(roleButton).toContainText(role);
}

test('cross-tab SSE sync: Act 4 in tab A is visible in tab B without refresh', async ({ browser }) => {
  // Tab A — OPERATIONS role on home page (where the demo command center lives)
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await pageA.goto('/');
  await switchRole(pageA, 'OPERATIONS');

  // Tab B — FAN role on home page (separate context = separate SSE connection)
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await pageB.goto('/');
  await switchRole(pageB, 'FAN');

  // Wait for the stadium map to render in tab B so we can read Gate C wait time.
  // The seed state has Gate C at 42 min wait. Capture it as the "before" value.
  const gateCBefore = pageB.locator('text=Gate C').first();
  await expect(gateCBefore).toBeVisible({ timeout: 15_000 });

  // In tab A, trigger Act 1 (reset) then Act 4 (apply What-If rerouting).
  // Act 1 resets to seed state; Act 4 applies the simulation which drops
  // Gate C wait from 42 → ~14 min.
  await pageA.getByRole('button', { name: /Trigger Act 1/i }).click();
  await pageA.waitForTimeout(1000);
  await pageA.getByRole('button', { name: /Trigger Act 4/i }).click();

  // Wait for the simulation to apply. The fan tab should see Gate C wait
  // time drop from 42 to ~14 without a manual refresh.
  // We check the stadium map tooltip or the gate label for the new value.
  // The SVG renders "GATE-C (14m)" after Act 4 applies.
  await expect(pageB.locator('text=/GATE-C \(1[0-9]m\)/i').first()).toBeVisible({ timeout: 20_000 });

  await ctxA.close();
  await ctxB.close();
});

test('security override in tab A flips gate status in tab B', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await pageA.goto('/');
  await switchRole(pageA, 'SECURITY');

  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await pageB.goto('/');
  await switchRole(pageB, 'FAN');

  // Wait for fan dashboard stadium map to render.
  await pageB.goto('/fan');
  await expect(pageB.locator('text=Gate C').first()).toBeVisible({ timeout: 15_000 });

  // SECURITY triggers override on Gate A in tab A.
  await pageA.goto('/security');
  // Wait for the override buttons to render
  await expect(pageA.getByRole('button', { name: /Trigger deterministic evacuation override on Gate A/i })).toBeVisible({ timeout: 15_000 });
  await pageA.getByRole('button', { name: /Trigger deterministic evacuation override on Gate A/i }).click();

  // Fan tab should see Gate A flip to EMERGENCY_EXIT_ONLY without refresh.
  await expect(pageB.locator('text=/EMERGENCY_EXIT_ONLY/i').first()).toBeVisible({ timeout: 20_000 });

  await ctxA.close();
  await ctxB.close();
});
