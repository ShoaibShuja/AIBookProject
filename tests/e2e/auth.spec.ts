import { expect, test } from '@playwright/test';

test('anonymous visitors are redirected to sign-in from protected book routes', async ({ page }) => {
  await page.goto('/books/example');
  await expect(page).toHaveURL(/\/sign-in/);
});
