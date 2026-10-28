import { test, expect, type Page } from '@playwright/test';

const next = (page: Page) =>
  page.getByRole('button', { name: 'Continuar', exact: true }).click();
const open = (page: Page) =>
  page.getByRole('button', { name: 'Monte sua barbearia' }).click();

test('answers build a dashboard, team, services and agenda matching the business', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/demo.html');
  await open(page);
  await page.getByLabel('Como se chama seu negócio?').fill('Barbearia Aurora');
  await page.getByLabel('Como podemos chamar o empresário?').fill('Ana');
  await page.getByLabel('Em qual cidade ele funciona?').fill('Recife, PE');
  await page
    .getByLabel('Qual identidade visual prefere?')
    .selectOption('oceano');
  await next(page);
  await page.getByLabel('Quantos profissionais atendem?').fill('3');
  await expect(page.getByLabel('Nome do profissional 3')).toBeVisible();
  await page.getByLabel('Nome do profissional 1').fill('Eduardo Lima');
  await page.getByLabel('Nome do profissional 2').fill('Bruno Costa');
  await page.getByLabel('Nome do profissional 3').fill('Caio Rocha');
  await next(page);
  await page
    .getByLabel('Qual regra usa nos serviços de plano?')
    .selectOption('percentual');
  await page.getByLabel('Fração da mensalidade para comissão (%)').fill('30');
  await page.getByLabel('Comissão de serviços avulsos (%)').fill('50');
  await page.getByLabel('Salário base · Eduardo Lima (R$)').fill('1000');
  await page.getByLabel('Salário base · Bruno Costa (R$)').fill('1200');
  await page.getByLabel('Salário base · Caio Rocha (R$)').fill('1300');
  await next(page);
  await page.getByLabel('Aluguel (R$)', { exact: true }).fill('1200');
  await next(page);
  const planCards = page.locator('.wizard-plan');
  for (const [index, qty, overdue, price] of [
    [0, 10, 1, 100, 2],
    [1, 5, 0, 50, 1],
    [2, 8, 2, 180, 3],
  ]) {
    const card = planCards.nth(index!);
    await card
      .getByLabel('Clientes cadastrados', { exact: true })
      .fill(String(qty));
    await card
      .getByLabel('Assinaturas vencidas', { exact: true })
      .fill(String(overdue));
    await card.getByLabel('Mensalidade média (R$)').fill(String(price));
  }
  await next(page);
  await page.getByLabel('Corte de cabelo (R$)', { exact: true }).fill('70');
  await page.getByLabel('Barba completa (R$)', { exact: true }).fill('40');
  await page.getByLabel('Corte + barba (R$)', { exact: true }).fill('100');
  await next(page);
  await page.getByLabel('Abre às').fill('10:00');
  await page.getByLabel('Fecha às').fill('18:00');
  await page
    .getByLabel('Preenchimento fictício da agenda do dia (%)')
    .fill('50');
  await next(page);
  await expect(page.getByRole('heading', { name: '8. Revisão' })).toBeVisible();
  await expect(page.locator('.wizard-review')).toContainText('3 profissionais');
  await expect(page.locator('.wizard-review')).toContainText('R$ 3.500,00');
  await expect(page.locator('.wizard-review')).toContainText('R$ 2.230,00');
  await page.getByRole('button', { name: 'Gerar meu dashboard' }).click();
  await expect(page.locator('.custom-summary')).toContainText(
    'Barbearia Aurora',
  );
  await expect(page.locator('.custom-summary')).toContainText(
    '6 sessões/profissional/dia',
  );
  await expect(page.locator('.shop-brand')).toContainText('Barbearia Aurora');
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'oceano');
  await expect(
    page.locator('.ledger-line').filter({ hasText: 'Mensalidades recebidas' }),
  ).toContainText('R$ 2.230,00');
  await expect(
    page.locator('.ledger-line').filter({ hasText: 'Salários base da equipe' }),
  ).toContainText('R$ 3.500,00');
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Minha equipe', exact: true })
    .click();
  await expect(page.locator('.staff-card')).toHaveCount(3);
  await expect(
    page.getByRole('heading', { name: 'Eduardo Lima', exact: true }),
  ).toBeVisible();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Serviços', exact: true })
    .click();
  await expect(
    page.locator('.card').filter({ hasText: 'Corte de cabelo' }),
  ).toContainText('R$ 70,00');
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await expect(
    page.getByLabel('Simular outro profissional').locator('option'),
  ).toHaveCount(3);
  await expect(page.locator('.appointment')).toHaveCount(3);
  await expect(page.locator('.info-grid')).toContainText('18:00');
  expect(errors).toEqual([]);
});

test('keeps drafts when returning, validates overdue and lunch, and cancels without applying', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/demo.html');
  await open(page);
  await page.getByLabel('Como se chama seu negócio?').fill('Meu rascunho');
  await next(page);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByLabel('Como se chama seu negócio?')).toHaveValue(
    'Meu rascunho',
  );
  await next(page);
  await next(page);
  await next(page);
  await next(page);
  const hair = page.locator('.wizard-plan').first();
  await hair.getByLabel('Clientes cadastrados', { exact: true }).fill('5');
  await hair.getByLabel('Assinaturas vencidas', { exact: true }).fill('6');
  await next(page);
  await expect(page.getByRole('alert')).toContainText(
    'vencidas não podem superar',
  );
  await hair.getByLabel('Assinaturas vencidas', { exact: true }).fill('1');
  await next(page);
  await next(page);
  await page.getByLabel('Fim do almoço').fill('11:00');
  await next(page);
  await expect(page.getByRole('alert')).toContainText(
    'almoço deve ficar dentro da jornada',
  );
  await page.getByLabel('Fim do almoço').fill('14:00');
  await next(page);
  await page.getByRole('button', { name: 'Sair sem aplicar' }).click();
  await expect(page.locator('.shop-brand')).toContainText('Ross');
  await expect(
    page.locator('.stat').filter({ hasText: 'Equipe' }),
  ).toContainText('5');
  await expect(page.locator('.custom-summary')).toHaveCount(0);
});

test('larger team and limited schedule warn about capacity and honor days off', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/demo.html');
  await open(page);
  await next(page);
  await page.getByLabel('Quantos profissionais atendem?').fill('8');
  await expect(page.getByLabel('Nome do profissional 8')).toBeVisible();
  await next(page);
  await next(page);
  await next(page);
  await next(page);
  await next(page);
  await page.getByLabel('Abre às').fill('09:00');
  await page.getByLabel('Fecha às').fill('11:00');
  await page.getByLabel('Tem pausa de almoço?').selectOption('nao');
  await page.getByLabel('Tempo reservado por atendimento').selectOption('30');
  for (const day of ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex'])
    await page.getByLabel(day, { exact: true }).uncheck();
  await next(page);
  await expect(page.locator('.wizard-warning')).toContainText(
    'supera a capacidade',
  );
  await expect(page.locator('.wizard-review')).toContainText('160 sessões');
  await page.getByRole('button', { name: 'Gerar meu dashboard' }).click();
  await expect(page.locator('.custom-summary')).toContainText(
    '8 profissionais',
  );
  await expect(page.locator('.footer>span').first()).toHaveText(
    'Ross Barbearia · Uma experiência AgendaFlex',
  );
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Minha equipe', exact: true })
    .click();
  await expect(page.locator('.staff-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Qua 28 OUT' })).toBeDisabled();
  await page.getByRole('button', { name: 'Sáb 31 OUT' }).click();
  await expect(page.locator('[data-time]')).toHaveCount(4);
  await page.getByRole('button', { name: '10:30', exact: true }).click();
  await page.getByRole('button', { name: 'Simular agendamento' }).click();
  await expect(page.locator('.booking-ticket')).toContainText('30 minutos');
  await page.getByRole('button', { name: 'Reiniciar demo' }).click();
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await expect(
    page.getByLabel('Simular outro profissional').locator('option'),
  ).toHaveCount(5);
  await expect(page.locator('.appointment')).toHaveCount(10);
  expect(errors).toEqual([]);
});
