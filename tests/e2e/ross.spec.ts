import { test, expect, type Page } from '@playwright/test';
const menu = (p: Page, name: string) =>
  p.locator('#menu').getByRole('button', { name, exact: true }).click();
const owner = (p: Page) =>
  p.getByRole('button', { name: 'Empresário', exact: true }).click();
const value = async (p: Page) =>
  Number(
    (await p.getByTestId('net-result').innerText())
      .replace(/[^0-9,.-]/g, '')
      .replaceAll('.', '')
      .replace(',', '.'),
  );

test('15-day window crosses months and plan billing validity is respected', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await expect(
    page.getByRole('img', { name: 'Logo Ross Barbearia' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Bem-vindo à Ross.' }),
  ).toBeVisible();
  await expect(page.locator('[data-day]')).toHaveCount(15);
  await page.getByLabel('Perfil de demonstração').selectOption('carlos');
  await page.getByRole('button', { name: /Corte \+ barba 60 min/ }).click();
  await expect(
    page.getByRole('radio', { name: /Usar meu plano/ }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Qua 11 NOV' }).click();
  await page.getByRole('button', { name: '20:00', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Simular agendamento' }),
  ).toBeDisabled();
  await page.getByRole('radio', { name: /Avulso/ }).check();
  await page.getByRole('button', { name: '20:00', exact: true }).click();
  await page.getByRole('button', { name: 'Simular agendamento' }).click();
  await expect(page.locator('.booking-ticket')).toContainText(
    '11 de novembro de 2026',
  );
  await expect(page.locator('.booking-ticket')).toContainText(
    'Avulso simulado',
  );
  await menu(page, 'Planos mensais');
  await expect(page.locator('.billing-card')).toContainText('Ross completo');
  await expect(page.locator('.billing-card')).toContainText(
    '01/10 a 31/10/2026',
  );
  await expect(page.locator('.billing-card')).toContainText(
    '01/11 a 30/11/2026',
  );
  await expect(page.locator('.billing-card')).toContainText(
    'Integração de pagamentos futura',
  );
});

test('team and service additions remain usable and removals protect active bookings', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await owner(page);
  await menu(page, 'Minha equipe');
  await page.getByLabel('Nome do novo barbeiro').fill('Henrique Almeida Ross');
  await page.getByLabel('Salário base mensal (R$)').fill('1500');
  await page
    .getByRole('button', { name: 'Adicionar barbeiro', exact: true })
    .click();
  await expect(page.locator('.staff-card')).toHaveCount(6);
  const card = page
    .locator('.staff-card')
    .filter({ hasText: 'Henrique Almeida Ross' });
  await card.getByRole('button', { name: 'Remover barbeiro' }).click();
  await expect(page.getByRole('dialog')).toContainText('Histórico e custos');
  await page.getByRole('button', { name: 'Confirmar remoção' }).click();
  await expect(page.locator('.staff-card')).toHaveCount(5);
  await menu(page, 'Dashboard financeiro');
  await expect(
    page.locator('.ledger-line').filter({ hasText: 'Salários base da equipe' }),
  ).toContainText('R$ 7.500,00');
  await menu(page, 'Minha equipe');
  await page
    .locator('.staff-card')
    .first()
    .getByRole('button', { name: 'Remover barbeiro' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('reservas ativas');
  await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await menu(page, 'Serviços');
  await page
    .getByLabel('Nome do serviço', { exact: true })
    .fill('Corte Kids Ross');
  await page.getByLabel('Preço (R$)', { exact: true }).fill('45');
  await page.getByRole('button', { name: 'Criar serviço avulso' }).click();
  await expect(
    page.getByRole('heading', { name: 'Corte Kids Ross' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await page.getByRole('button', { name: /Corte Kids Ross 60 min/ }).click();
  await expect(page.locator('.summary .total')).toContainText('R$ 45,00');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('additional fixed and variable expenses affect the financial result without duplicates', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await owner(page);
  await menu(page, 'Dashboard financeiro');
  const initial = await value(page);
  const text = await page.locator('.equation').first().innerText();
  const completed = Number(text.match(/(\d+) atendimentos concluídos/)?.[1]);
  expect(completed).toBeGreaterThan(0);
  await menu(page, 'Custos e repasses');
  await page
    .getByRole('button', { name: '+ Adicionar gasto', exact: true })
    .click();
  let row = page.locator('.dynamic-row').first();
  await row.getByLabel('Nome do gasto').fill('Seguro mensal Ross');
  await row.getByLabel('Valor (R$)').fill('100');
  await page
    .getByRole('button', { name: '+ Adicionar gasto', exact: true })
    .click();
  row = page.locator('.dynamic-row').nth(1);
  await row.getByLabel('Nome do gasto').fill('Toalhas por visita');
  await row
    .getByLabel('Tipo do gasto', { exact: true })
    .selectOption('variavel');
  await row.getByLabel('Valor (R$)').fill('2');
  await page
    .getByRole('button', { name: 'Aplicar regras na simulação' })
    .click();
  await menu(page, 'Dashboard financeiro');
  expect(await value(page)).toBeCloseTo(initial - 100 - 2 * completed, 2);
  await menu(page, 'Custos e repasses');
  await page
    .locator('.dynamic-row')
    .nth(1)
    .getByRole('button', { name: 'Remover gasto' })
    .click();
  await page
    .getByRole('button', { name: 'Aplicar regras na simulação' })
    .click();
  await menu(page, 'Dashboard financeiro');
  expect(await value(page)).toBeCloseTo(initial - 100, 2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('leave blocks the original barber and a confirmed transfer keeps time and client', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Qui 29 OUT' }).click();
  await page.getByRole('button', { name: '14:00', exact: true }).click();
  await page.getByRole('button', { name: 'Simular agendamento' }).click();
  await owner(page);
  await menu(page, 'Folgas e transferências');
  await page
    .getByRole('button', { name: 'Registrar folga', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Reservas que precisam de atenção' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Escolher outro barbeiro' }).click();
  await page.getByLabel('Novo barbeiro disponível').selectOption('2');
  await page.getByRole('button', { name: 'Confirmar transferência' }).click();
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await menu(page, 'Meu agendamento');
  await expect(page.locator('.booking-ticket')).toContainText('Bruno Alves');
  await expect(page.locator('.booking-ticket')).toContainText('14:00');
  await menu(page, 'Agendar horário');
  await expect(
    page.getByRole('button', { name: '14:00', exact: true }),
  ).toBeDisabled();
  await owner(page);
  await menu(page, 'Clientes e histórico');
  await page.getByLabel('Buscar perfil de cliente').fill('Visitante da demo');
  await page.getByRole('button', { name: 'Ver perfil' }).click();
  await expect(
    page.getByRole('heading', { name: 'Próximos agendamentos' }),
  ).toBeVisible();
  await expect(page.locator('.record-list').first()).toContainText(
    'Bruno Alves',
  );
});

test('no-show requires confirmation and releases a still-valid slot without commission', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  const row = page.locator('.appointment').filter({ hasText: 'João Oliveira' });
  await row.getByRole('button', { name: 'Cliente não vem/veio' }).click();
  await expect(page.getByRole('dialog')).toContainText('Confirmar ausência');
  await page
    .getByRole('button', { name: 'Manter atendimento', exact: true })
    .click();
  await expect(row).toContainText('Confirmado');
  await row.getByRole('button', { name: 'Cliente não vem/veio' }).click();
  await page
    .getByRole('button', { name: 'Confirmar ausência e cancelar' })
    .click();
  await expect(
    page.locator('.appointment').filter({ hasText: 'João Oliveira' }),
  ).toContainText('Não compareceu');
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '09:00', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: '11:00', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: '11:00', exact: true }).click();
  await page.getByRole('button', { name: 'Simular agendamento' }).click();
  await expect(page.locator('.booking-ticket')).toContainText('11:00');
  await owner(page);
  await menu(page, 'Agenda');
  await expect(page.getByRole('row', { name: /João Oliveira/ })).toContainText(
    'Não compareceu',
  );
  await expect(
    page.getByRole('row', { name: /Visitante da demo/ }),
  ).toContainText('Confirmado');
});

test('unavailable transfer stays untouched and recorded visits update recurring-use metrics', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await owner(page);
  await menu(page, 'Agenda');
  await page
    .getByRole('row', { name: /João Oliveira/ })
    .getByRole('button', { name: 'Transferir', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Nenhum outro barbeiro');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await menu(page, 'Planos e assinantes');
  const before = Number(
    await page.locator('.usage-metrics strong').first().innerText(),
  );
  const repeat = Number(
    await page.locator('.usage-metrics strong').nth(1).innerText(),
  );
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await page
    .locator('.appointment')
    .filter({ hasText: 'João Oliveira' })
    .getByRole('button', { name: 'Iniciar atendimento' })
    .click();
  await page.getByRole('button', { name: 'Concluir atendimento' }).click();
  await owner(page);
  await menu(page, 'Planos e assinantes');
  await expect(page.locator('.usage-metrics strong').first()).toHaveText(
    String(before + 1),
  );
  await expect(page.locator('.usage-metrics strong').nth(1)).toHaveText(
    String(repeat + 1),
  );
  await menu(page, 'Clientes e histórico');
  await page.getByLabel('Buscar perfil de cliente').fill('João Oliveira');
  await page.getByRole('button', { name: 'Ver perfil' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atendimentos realizados em 2026' }),
  ).toBeVisible();
  await expect(
    page.locator('.stat').filter({ hasText: 'Realizados no ano' }),
  ).toContainText('3');
});

test('questionnaire adds and removes team, expenses and services in responsive forms', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Monte sua barbearia' }).click();
  const next = () =>
    page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await next();
  await page
    .getByRole('button', { name: '+ Adicionar barbeiro', exact: true })
    .click();
  await page.getByLabel('Nome do profissional 6').fill('Henrique Ross');
  await page
    .locator('#wizard-staff-fields label')
    .first()
    .getByRole('button', { name: 'Remover barbeiro' })
    .click();
  await expect(page.getByLabel('Quantos profissionais atendem?')).toHaveValue(
    '5',
  );
  await page
    .getByRole('button', { name: '+ Adicionar barbeiro', exact: true })
    .click();
  await expect(page.getByLabel('Quantos profissionais atendem?')).toHaveValue(
    '6',
  );
  await next();
  await next();
  await page
    .getByRole('button', { name: '+ Adicionar gasto', exact: true })
    .click();
  await page
    .locator('.dynamic-row')
    .getByLabel('Nome do gasto')
    .fill('Lavanderia mensal');
  await page.locator('.dynamic-row').getByLabel('Valor (R$)').fill('80');
  await next();
  await expect(
    page.getByLabel('Visitas estimadas por assinante no mês'),
  ).toHaveCount(0);
  await next();
  await page
    .getByRole('button', { name: '+ Adicionar serviço avulso', exact: true })
    .click();
  await page.getByLabel('Nome do novo serviço 5').fill('Pezinho Ross');
  await next();
  await next();
  await expect(page.locator('.wizard-review')).toContainText('R$ 1.930,00');
  await page.getByRole('button', { name: 'Gerar meu dashboard' }).click();
  await menu(page, 'Minha equipe');
  await expect(
    page.getByRole('heading', { name: 'Henrique Ross', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.staff-card')).toHaveCount(6);
  await menu(page, 'Serviços');
  await expect(
    page.getByRole('heading', { name: 'Pezinho Ross', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  const ids = await page
    .getByLabel('Simular outro profissional')
    .locator('option')
    .evaluateAll((items) => items.map((o) => (o as HTMLOptionElement).value));
  expect(new Set(ids).size).toBe(ids.length);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('long dynamic lists keep controls aligned across narrow, tablet and desktop widths', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/demo.html');
  await owner(page);
  await menu(page, 'Minha equipe');
  for (let i = 0; i < 3; i++) {
    await page
      .getByLabel('Nome do novo barbeiro')
      .fill(`Profissional Ross Nome Completo ${i + 1}`);
    await page.getByLabel('Salário base mensal (R$)').fill('0');
    await page
      .getByRole('button', { name: 'Adicionar barbeiro', exact: true })
      .click();
  }
  await expect(page.locator('.staff-card')).toHaveCount(8);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await menu(page, 'Serviços');
  for (let i = 0; i < 3; i++) {
    await page
      .getByLabel('Nome do serviço', { exact: true })
      .fill(`Cuidado Ross personalizado ${i + 1}`);
    await page.getByLabel('Preço (R$)', { exact: true }).fill('75');
    await page.getByRole('button', { name: 'Criar serviço avulso' }).click();
  }
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await expect(page.locator('[data-service]')).toHaveCount(7);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await owner(page);
  await menu(page, 'Custos e repasses');
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole('button', { name: '+ Adicionar gasto', exact: true })
      .click();
    await page
      .locator('.dynamic-row')
      .nth(i)
      .getByLabel('Nome do gasto')
      .fill(`Gasto adicional mensal ${i + 1}`);
  }
  await expect(page.locator('.dynamic-row')).toHaveCount(3);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
