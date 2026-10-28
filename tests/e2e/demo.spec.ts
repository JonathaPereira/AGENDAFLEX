import { test, expect } from '@playwright/test';

test('simulates a booking shared by customer and owner, then cancels it', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Bruno Degradê & estilo' }).click();
  await page.getByRole('button', { name: 'Qui 29 OUT' }).click();
  await page.getByRole('button', { name: '13:00', exact: true }).click();
  await page.getByRole('button', { name: 'Simular agendamento' }).click();
  await expect(
    page.getByRole('heading', { name: 'Seu momento está reservado.' }),
  ).toBeVisible();
  await expect(page.locator('.booking-ticket')).toContainText('Bruno Alves');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page.getByLabel('Filtrar dia').selectOption('29');
  await page.getByLabel('Filtrar profissional').selectOption('2');
  await expect(
    page.getByRole('row', { name: /Visitante da demo/ }),
  ).toContainText('13:00');
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await page
    .getByRole('button', { name: 'Meu agendamento', exact: true })
    .click();
  await page.getByRole('button', { name: 'Cancelar simulação' }).click();
  await expect(
    page.getByRole('heading', { name: 'Simulação cancelada' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await expect(
    page.getByRole('row', { name: /Visitante da demo/ }),
  ).toContainText('Cancelado');
});

test('barber can complete a simulated appointment and owner sees the result', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar atendimento' }).click();
  await expect(
    page.locator('.appointment').filter({ hasText: 'João Oliveira' }),
  ).toContainText('Em atendimento');
  await page.getByRole('button', { name: 'Concluir atendimento' }).click();
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await expect(page.getByRole('row', { name: /João Oliveira/ })).toContainText(
    'Concluído',
  );
  await page.getByLabel('Buscar cliente').fill('cliente inexistente');
  await expect(
    page.getByText('Nenhum agendamento para esses filtros.'),
  ).toBeVisible();
});

test('shows five team members, resets state and works on small screens', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/demo.html');
  await expect(
    page.getByRole('button', { name: 'Simular agendamento' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Conheça a equipe' }).click();
  await expect(page.locator('.staff-card')).toHaveCount(5);
  await page.getByRole('button', { name: 'Agendar com Lucas' }).click();
  await expect(page.locator('.summary')).toContainText('Lucas Rocha');
  await page.getByRole('button', { name: 'Reiniciar demo' }).click();
  await expect(page.locator('.summary')).toContainText('Rafael Lima');
  for (const role of ['Cliente', 'Empresário', 'Barbeiro']) {
    await page.getByRole('button', { name: role, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
