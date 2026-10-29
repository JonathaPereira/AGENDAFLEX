import { test, expect } from '@playwright/test';
test('Ross login renders its real logo and fails closed when no project is configured', async ({
  page,
}) => {
  await page.goto('/login');
  await expect(
    page.getByRole('img', { name: 'Ross Barbearia', exact: true }),
  ).toBeVisible();
  expect(
    await page
      .getByRole('img', { name: 'Ross Barbearia', exact: true })
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await expect(
    page.getByRole('button', { name: 'Entrar', exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole('status')).toContainText(
    'Conexão com o Supabase pendente',
  );
  await page.getByLabel('Senha', { exact: true }).fill('exemplo-sem-conta');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('offers signup and recovery without creating a fake session', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Criar conta', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Crie sua conta.' }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Repita a senha', { exact: true }),
  ).toHaveAttribute('minlength', '12');
  await page.getByRole('link', { name: 'Voltar para entrar' }).click();
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click();
  await expect(
    page.getByRole('heading', { name: 'Recupere seu acesso.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Enviar instruções' }),
  ).toBeDisabled();
});
test('invalid confirmation and recovery links fail without exposing an account', async ({
  page,
}) => {
  for (const path of [
    '/auth/callback?error=access_denied',
    '/redefinir-senha?code=invalid',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('alert')).toContainText('Link inválido');
    await expect(
      page.getByRole('button', { name: 'Salvar nova senha' }),
    ).toHaveCount(0);
  }
});
