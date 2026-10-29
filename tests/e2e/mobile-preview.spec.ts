import { test, expect } from '@playwright/test';
test('mobile preview stays clearly fictitious and returns to the real login', async ({
  page,
}) => {
  await page.goto('/login');
  await page
    .getByRole('link', { name: 'Ver demonstração para celular' })
    .click();
  await expect(page).toHaveURL('/mobile');
  await expect(
    page.getByText('Dados fictícios · Sem pagamentos reais'),
  ).toBeVisible();
  const demo = page.frameLocator(
    'iframe[title="Demonstração interativa Ross Barbearia"]',
  );
  await expect(
    demo.getByRole('heading', { name: 'Bem-vindo à Ross.' }),
  ).toBeVisible();
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole('link', { name: 'Voltar ao login', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Bem-vindo de volta.' }),
  ).toBeVisible();
});
