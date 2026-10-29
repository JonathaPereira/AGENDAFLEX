import { expect, test, type Page } from '@playwright/test';
import { fixtureIds, fixtureToken } from '../fixtures/billing-identities';
async function login(page: Page, role: keyof typeof fixtureIds) {
  const id = fixtureIds[role],
    user = {
      id,
      email: `${role}@example.test`,
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: { provider: 'email' },
      user_metadata: { role: 'owner' },
    };
  await page.route('https://billing-fixture.supabase.co/**', async (route) => {
    const response = route.request().url().includes('/token')
      ? {
          access_token: fixtureToken(id),
          refresh_token: 'fixture',
          expires_in: 3600,
          token_type: 'bearer',
          user,
        }
      : user;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill(user.email);
  await page
    .getByLabel('Senha', { exact: true })
    .fill('Teste-sem-conta-real-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/conta');
  await page.goto('/barbearia/ross-barbearia');
  await expect(
    page.getByText('Ambiente de teste', { exact: true }),
  ).toBeVisible();
}
async function subscribe(page: Page) {
  await page.getByLabel('Seu nome', { exact: true }).fill('João de teste');
  await page.getByRole('button', { name: 'Concluir meu cadastro' }).click();
  await expect(
    page.getByRole('heading', { name: 'Bem-vindo, João de teste.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Escolher plano', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Ross completo', exact: true }),
  ).toHaveCount(2);
}
async function chooseSlot(page: Page) {
  await page.getByLabel('Serviço', { exact: true }).selectOption({ index: 1 });
  await page
    .getByLabel('Profissional', { exact: true })
    .selectOption({ label: 'Barbeiro Ross' });
  const date = await page
    .getByLabel('Data', { exact: true })
    .getAttribute('max');
  await page.getByLabel('Data', { exact: true }).fill(date!);
  await expect(page.getByLabel('Horário disponível')).toBeEnabled();
  await page.getByLabel('Horário disponível').selectOption({ index: 1 });
}
test.beforeEach(async ({ request }) => {
  expect(
    (await request.post('http://127.0.0.1:3003/__fixture/reset')).ok(),
  ).toBeTruthy();
});
test('customer payment updates the real API/database and owner refund revokes access without exposing refund to customer', async ({
  page,
  browser,
}, testInfo) => {
  await login(page, 'customer');
  await subscribe(page);
  await page
    .getByRole('button', { name: 'Simular pagamento', exact: true })
    .click();
  await expect(
    page.locator('.billing-status').filter({ hasText: /^Em dia$/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reembolsar mensalidade' }),
  ).toHaveCount(0);
  await chooseSlot(page);
  await page.getByRole('button', { name: 'Reservar horário' }).click();
  await expect(
    page.getByRole('heading', { name: 'Corte Ross', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: testInfo.outputPath('customer.png'),
    fullPage: true,
  });
  const owner = await browser.newPage();
  await login(owner, 'owner');
  await expect(
    owner.getByRole('heading', { name: 'Faturamento do empresário' }),
  ).toBeVisible();
  await owner
    .getByRole('button', { name: 'Mensalidades e pagamentos', exact: true })
    .click();
  await owner
    .getByRole('button', { name: 'Reembolsar mensalidade', exact: true })
    .click();
  const dialog = owner.getByRole('dialog', {
    name: 'Confirmar reembolso de teste',
  });
  await expect(dialog).toBeVisible();
  await owner.setViewportSize({ width: 390, height: 844 });
  expect(
    await owner.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await owner.screenshot({ path: testInfo.outputPath('refund.png') });
  await dialog
    .getByLabel('Motivo do reembolso')
    .fill('Cancelamento solicitado pelo cliente');
  await dialog
    .getByRole('button', { name: 'Confirmar reembolso', exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    owner.locator('.billing-status').filter({ hasText: /^Reembolsado$/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Atualizar dados' }).click();
  await expect(
    page.locator('.billing-status').filter({ hasText: /^Reembolsado$/ }),
  ).toBeVisible();
  await expect(
    page.locator('.billing-status').filter({ hasText: /^Cancelado$/ }),
  ).toBeVisible();
  await chooseSlot(page);
  await page.getByRole('button', { name: 'Reservar horário' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível agendar neste momento. Por favor, entre em contato com a recepção.',
  );
  await owner.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(
    owner
      .getByRole('heading', { name: 'Saldo após reembolsos', exact: true })
      .locator('..')
      .getByText(/^R\$\s*0,00$/),
  ).toBeVisible();
  await owner.close();
});
test('overdue message is discreet and pending simulation never grants a plan appointment', async ({
  page,
  request,
}) => {
  await login(page, 'customer');
  await subscribe(page);
  await request.post('http://127.0.0.1:3003/__fixture/overdue');
  await page.getByRole('button', { name: 'Atualizar dados' }).click();
  await expect(
    page.locator('.billing-status').filter({ hasText: /^Ciclo pendente$/ }),
  ).toBeVisible();
  await page.getByLabel('Resultado do teste').selectOption('pending');
  await page
    .getByRole('button', { name: 'Simular pagamento', exact: true })
    .click();
  await chooseSlot(page);
  await page.getByRole('button', { name: 'Reservar horário' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível agendar neste momento. Por favor, entre em contato com a recepção.',
  );
  await expect(
    page.getByRole('heading', { name: 'Corte Ross', exact: true }),
  ).toHaveCount(0);
});
test('owner freely navigates settings and edits service duration; staff has no financial or refund menu', async ({
  page,
}) => {
  await login(page, 'owner');
  await page
    .getByRole('button', { name: 'Configurar negócio', exact: true })
    .click();
  await page.getByRole('button', { name: 'Serviços', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Corte Ross' }).click();
  await page.getByLabel('Duração em minutos').fill('45');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByText('45 minutos', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Barbeiros', exact: true }).click();
  await page.getByRole('button', { name: 'Planos', exact: true }).click();
  await expect(page.getByLabel('Cobertura')).toBeVisible();
  await page.getByRole('button', { name: 'Barbeiros', exact: true }).click();
  await page
    .getByLabel('Nome', { exact: true })
    .fill('Empresário também atende');
  await page
    .getByLabel('Conta vinculada')
    .selectOption({ label: 'owner@example.test' });
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(
    page.getByRole('heading', { name: 'Empresário também atende' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Minha agenda como barbeiro', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Minha agenda como barbeiro' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL('/login');
  await login(page, 'staff');
  await expect(
    page.getByRole('button', { name: 'Configurar negócio', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Reembolsar mensalidade' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Faturamento do empresário' }),
  ).toHaveCount(0);
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
});
