import { test, expect } from '@playwright/test';
test('loads public foundation and health without database credentials', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Mais espaço para',
  );
  await expect(page.getByRole('status')).toHaveText('API disponível');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
for (const path of ['/painel', '/saas', '/conta'])
  test(`protects ${path} without a session`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL('/login');
    await expect(
      page.getByRole('heading', { name: 'Bem-vindo de volta.' }),
    ).toBeVisible();
  });
test('changes theme with keyboard and directs protected navigation to login', async ({
  page,
}) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Tema escuro' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page
    .getByRole('link', { name: 'Estabelecimento', exact: true })
    .click();
  await expect(page).toHaveURL('/login');
});
test('handles unknown routes', async ({ page }) => {
  await page.goto('/inexistente');
  await expect(
    page.getByRole('heading', { name: 'Página não encontrada' }),
  ).toBeVisible();
});
