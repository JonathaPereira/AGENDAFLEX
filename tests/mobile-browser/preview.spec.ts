import { test, expect } from '@playwright/test';
test('packaged preview keeps real authentication off and provides a return path', async ({
  page,
}) => {
  const real: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('supabase.co') || r.url().includes(':3001'))
      real.push(r.url());
  });
  await page.goto('/login');
  await expect(
    page.getByText('Prévia mobile · Acesso real desativado nesta compilação'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Entrar', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('link', { name: 'Ver demonstração para celular' })
    .click();
  const demo = page.frameLocator('iframe');
  await expect(
    demo.getByRole('heading', { name: 'Bem-vindo à Ross.' }),
  ).toBeVisible();
  await demo.getByRole('button', { name: 'Empresário', exact: true }).click();
  await expect(
    demo.getByRole('button', { name: 'Modo barbeiro', exact: true }),
  ).toBeVisible();
  await demo.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await expect(
    demo.getByRole('heading', { name: 'Sua agenda de hoje' }),
  ).toBeVisible();
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await demo
        .locator('html')
        .evaluate(
          (el) => el.scrollWidth <= el.ownerDocument.defaultView!.innerWidth,
        ),
    ).toBe(true);
  }
  await page
    .getByRole('link', { name: 'Voltar ao login', exact: true })
    .click();
  await expect(page).toHaveURL('/login');
  expect(real).toEqual([]);
});
