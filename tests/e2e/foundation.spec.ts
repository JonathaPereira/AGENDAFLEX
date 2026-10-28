import { test, expect } from '@playwright/test';
for (const [path, heading] of [
  ['/', 'Mais espaço para'],
  ['/painel', 'Painel do estabelecimento'],
  ['/saas', 'Gestão SaaS'],
] as const) {
  test(`loads ${path} directly`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      heading,
    );
    await expect(page.getByRole('status')).toHaveText('API disponível');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
test('navigates between areas and changes theme with keyboard', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('link', { name: 'Estabelecimento', exact: true })
    .click();
  await expect(page).toHaveURL('/painel');
  const toggle = page.getByRole('button', { name: 'Tema escuro' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Tema claro' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('handles unknown routes', async ({ page }) => {
  await page.goto('/inexistente');
  await expect(
    page.getByRole('heading', { name: 'Página não encontrada' }),
  ).toBeVisible();
});
