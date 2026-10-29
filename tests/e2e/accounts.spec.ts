import { test, expect, type Page } from '@playwright/test';
const menu = (p: Page, name: string) =>
  p.locator('#menu').getByRole('button', { name, exact: true }).click();
async function login(p: Page, email: string) {
  await p
    .getByRole('button', { name: 'Simular login por e-mail', exact: true })
    .click();
  await p.getByLabel('E-mail do perfil').fill(email);
  await p.getByRole('button', { name: 'Abrir perfil de demonstração' }).click();
}
async function register(p: Page, email: string, cpf: string, plan = '') {
  await menu(p, 'Cadastrar cliente');
  await p
    .getByLabel('Nome completo', { exact: true })
    .fill('Cliente Teste Ross');
  await p.getByLabel('E-mail de acesso').fill(email);
  await p.getByLabel('CPF', { exact: true }).fill(cpf);
  await p.getByLabel('RG', { exact: true }).fill('RG-FICTICIO');
  await p.getByLabel('Endereço completo').fill('Rua Fictícia, 123');
  await p.getByLabel('Número de celular').fill('(11) 99999-0000');
  if (plan)
    await p
      .getByLabel('Assinatura inicial')
      .selectOption(plan === 'first' ? { index: 1 } : { label: plan });
  await p.getByRole('button', { name: 'Salvar cliente', exact: true }).click();
}
test('owner and barber register clients, reject duplicates and show role-specific email previews', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await login(page, 'proprietario@ross.example');
  await register(page, 'cliente.teste@example.com', '00000000000');
  await expect(page.getByRole('status')).toContainText('Cliente cadastrado');
  await register(page, 'cliente.teste@example.com', '11111111111');
  await expect(page.locator('#registration-error')).toContainText(
    'já cadastrado',
  );
  await menu(page, 'Clientes e histórico');
  await page.getByLabel('Buscar perfil de cliente').fill('Cliente Teste');
  await page.getByRole('button', { name: 'Ver perfil', exact: true }).click();
  await expect(page.locator('#main')).toContainText('RG-FICTICIO');
  await expect(page.locator('#main')).toContainText('Rua Fictícia, 123');
  await page
    .getByRole('button', { name: 'Sair do perfil de demonstração' })
    .click();
  await login(page, 'cliente.teste@example.com');
  await expect(page.locator('.role-switch')).toBeHidden();
  await expect(page.locator('#identity')).toContainText(
    'cliente.teste@example.com',
  );
  await expect(page.locator('#menu')).not.toContainText('Custos');
  await expect(page.locator('#menu')).not.toContainText('Cadastrar cliente');
  await page
    .getByRole('button', { name: 'Sair do perfil de demonstração' })
    .click();
  await login(page, 'barbeiro2@ross.example');
  await expect(page.locator('#barber-select')).toBeHidden();
  await expect(page.locator('#menu')).not.toContainText('Dashboard financeiro');
  await register(page, 'outro.cliente@example.com', '22222222222');
  await expect(page.getByRole('status')).toContainText('Cliente cadastrado');
});

test('wizard topics can be visited directly while preserving edits', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await menu(page, 'Configurar negócio');
  await page
    .getByLabel('Como se chama seu negócio?')
    .fill('Ross Personalizada');
  await page.locator('[data-wizard-step="5"]').click();
  await expect(page.locator('#wizard-form h2')).toContainText(
    'Serviços avulsos',
  );
  await page.locator('[data-wizard-step="1"]').click();
  await expect(page.locator('#wizard-form h2')).toContainText('Sua equipe');
  await page.locator('[data-wizard-step="0"]').click();
  await expect(page.getByLabel('Como se chama seu negócio?')).toHaveValue(
    'Ross Personalizada',
  );
});

test('existing services can be edited and used with the new duration', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await menu(page, 'Serviços');
  await page
    .getByRole('button', { name: 'Editar Corte de cabelo', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Nome do serviço', { exact: true })
    .fill('Corte Ross Premium');
  await dialog.getByLabel('Duração do serviço (min)').fill('90');
  await dialog.getByRole('button', { name: 'Salvar serviço' }).click();
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await page.getByRole('button', { name: /Corte Ross Premium 90 min/ }).click();
  await expect(page.locator('.summary')).toContainText('90 minutos');
  // The last 20h slot cannot fit a 90-minute service before closing at 21h.
  await page.locator('[data-day="42"]').click();
  await expect(
    page.getByRole('button', { name: '20:00', exact: true }),
  ).toBeDisabled();
});

test('current subscribers reserve next month and see payment preference without a fake renewal', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await login(page, 'carlos@cliente.ross.example');
  await page.getByRole('button', { name: /Corte \+ barba 60 min/ }).click();
  await page.locator('[data-day="42"]').click();
  await page.getByRole('button', { name: '20:00', exact: true }).click();
  await page.getByRole('button', { name: 'Simular agendamento' }).click();
  await expect(page.locator('.booking-ticket')).toContainText(
    'Reserva antecipada',
  );
  await menu(page, 'Planos mensais');
  await page
    .getByLabel('Forma de pagamento', { exact: true })
    .selectOption('credito');
  await page.getByRole('button', { name: 'Salvar preferência' }).click();
  await expect(page.locator('.billing-card')).toContainText(
    'Débito previsto no cartão de crédito: dia 28',
  );
  await expect(page.locator('.billing-card')).toContainText('31/10/2026');
  await expect(page.locator('.billing-card')).toContainText(
    '28/10/2026 · Cartão de crédito',
  );
});

test('cash receipt requires confirmation, renews once and keeps next cycle separate', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await login(page, 'barbeiro2@ross.example');
  await menu(page, 'Receber no salão');
  await page
    .getByLabel('E-mail do assinante')
    .fill('joao@cliente.ross.example');
  await page.getByRole('button', { name: 'Localizar assinatura' }).click();
  await page.getByRole('button', { name: 'Voltar sem dar baixa' }).click();
  await page.getByRole('button', { name: 'Localizar assinatura' }).click();
  await page.getByLabel('Recebido por').selectOption('dinheiro');
  await page.getByRole('button', { name: 'Confirmar baixa e renovar' }).click();
  await page
    .getByLabel('E-mail do assinante')
    .fill('joao@cliente.ross.example');
  await page.getByRole('button', { name: 'Localizar assinatura' }).click();
  await expect(page.getByRole('status')).toContainText('já confirmado');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page
    .getByRole('button', { name: 'Sair do perfil de demonstração' })
    .click();
  await login(page, 'proprietario@ross.example');
  await menu(page, 'Recebimentos e renovações');
  await expect(page.locator('.record-list article')).toHaveCount(1);
  await expect(page.locator('.record-list')).toContainText('Novembro/2026');
  await expect(page.locator('.record-list')).toContainText('Dinheiro');
  await expect(page.locator('.record-list')).toContainText('Bruno Alves');
  await page
    .getByRole('button', { name: 'Sair do perfil de demonstração' })
    .click();
  await login(page, 'joao@cliente.ross.example');
  await menu(page, 'Planos mensais');
  await expect(page.locator('.billing-card')).toContainText('30/11/2026');
});

test('a newly registered subscriber starts unpaid and a cash receipt releases the current cycle', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await login(page, 'barbeiro2@ross.example');
  await register(page, 'plano.novo@example.com', '33333333333', 'first');
  await page
    .getByRole('button', { name: 'Sair do perfil de demonstração' })
    .click();
  await login(page, 'plano.novo@example.com');
  await expect(page.locator('.member-banner')).toContainText(
    'Assinatura vencida',
  );
  await page.locator('[data-day="42"]').click();
  await page.getByRole('button', { name: '20:00', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Simular agendamento' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Sair do perfil de demonstração' })
    .click();
  await login(page, 'barbeiro2@ross.example');
  await menu(page, 'Receber no salão');
  await page.getByLabel('E-mail do assinante').fill('plano.novo@example.com');
  await page.getByRole('button', { name: 'Localizar assinatura' }).click();
  await expect(page.getByRole('dialog')).toContainText('01/10 a 31/10/2026');
  await page.getByLabel('Recebido por').selectOption('dinheiro');
  await page.getByRole('button', { name: 'Confirmar baixa e renovar' }).click();
  await page
    .getByRole('button', { name: 'Sair do perfil de demonstração' })
    .click();
  await login(page, 'plano.novo@example.com');
  await menu(page, 'Planos mensais');
  await expect(page.locator('.billing-card')).toContainText('Em dia');
  await expect(page.locator('.billing-card')).toContainText('31/10/2026');
});
