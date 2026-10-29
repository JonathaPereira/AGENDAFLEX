import { test, expect, type Page } from '@playwright/test';
const id = '11111111-1111-4111-8111-111111111111';
const user = {
  id,
  email: 'teste@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2026-10-29T12:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: { role: 'owner' },
};
async function mockServices(page: Page, owner = false, reject = false) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  await page.route('https://auth-fixture.supabase.co/**', async (route) => {
    if (route.request().url().includes('/token')) {
      if (reject) {
        await route.fulfill({
          status: 400,
          headers,
          body: JSON.stringify({
            code: 'invalid_credentials',
            msg: 'Invalid credentials',
          }),
        });
        return;
      }
      const token = `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`;
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({
          access_token: token,
          refresh_token: 'test-refresh',
          token_type: 'bearer',
          expires_in: 3600,
          user,
        }),
      });
      return;
    }
    if (route.request().url().includes('/logout')) {
      await route.fulfill({ status: 204, headers });
      return;
    }
    await route.fulfill({ status: 200, headers, body: JSON.stringify(user) });
  });
  await page.route('http://127.0.0.1:3002/me', (route) =>
    route.fulfill({
      status: 200,
      headers,
      body: JSON.stringify({
        user: { id, email: user.email },
        memberships: owner
          ? [{ tenantId: id, tenantName: 'Ross Barbearia', role: 'owner' }]
          : [],
      }),
    }),
  );
}
async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill('Senha-de-teste-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
test('client session restores and signs out, while user metadata cannot grant management', async ({
  page,
}) => {
  await mockServices(page);
  await signIn(page);
  await expect(page).toHaveURL('/conta');
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.goto('/painel');
  await expect(
    page.getByRole('heading', { name: 'Acesso restrito.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Voltar à minha conta' }).click();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page).toHaveURL('/login');
  await page.goto('/conta');
  await expect(page).toHaveURL('/login');
});
test('server membership allows the establishment panel but never platform administration', async ({
  page,
}) => {
  await mockServices(page, true);
  await signIn(page);
  await page.getByRole('link', { name: 'Acessar painel' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Painel do estabelecimento',
      exact: true,
    }),
  ).toBeVisible();
  await page.goto('/saas');
  await expect(
    page.getByRole('heading', { name: 'Acesso restrito.' }),
  ).toBeVisible();
});
test('wrong password remains on login without an invented session', async ({
  page,
}) => {
  await mockServices(page, false, true);
  await signIn(page);
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível entrar',
  );
  await expect(page).toHaveURL('/login');
  await page.goto('/painel');
  await expect(page).toHaveURL('/login');
});
