import { test, expect } from '@playwright/test';

test('simulates a booking shared by customer and owner, then cancels it', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Bruno Degradê & estilo' }).click();
  await page.getByRole('button', { name: 'Qui 29 OUT' }).click();
  await page.getByRole('button', { name: '14:00', exact: true }).click();
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
  ).toContainText('14:00');
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
  await page
    .getByRole('button', { name: 'Iniciar atendimento' })
    .first()
    .click();
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

test('monthly combo is included and arrives at owner with no duplicate revenue', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByLabel('Perfil de demonstração').selectOption('carlos');
  await page.getByRole('button', { name: /Corte \+ barba 60 min/ }).click();
  await expect(page.locator('.summary .total')).toContainText('R$ 0,00');
  await page.getByRole('button', { name: 'Qui 29 OUT' }).click();
  await page.getByRole('button', { name: '14:00', exact: true }).click();
  await page.getByRole('button', { name: 'Simular agendamento' }).click();
  await expect(page.locator('.booking-ticket')).toContainText(
    'Incluído na mensalidade',
  );
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page.getByLabel('Filtrar dia').selectOption('29');
  await expect(page.getByRole('row', { name: /Carlos Ribeiro/ })).toContainText(
    'Incluído no plano',
  );
  await expect(
    page.locator('.stat').filter({ hasText: 'Avulsos previstos' }),
  ).toContainText('R$ 0,00');
});

test('financial scenarios distinguish average revenue, contribution and payout rules', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Simulador de margem' })
    .click();
  const joao = page.getByRole('row', { name: /João · 2 visitas/ });
  await expect(joao).toContainText('R$ 60,00');
  await expect(joao).toContainText('R$ 50,00');
  await expect(joao).toContainText('R$ 52,80');
  await expect(joao).toContainText('R$ 54,80');
  const antonio = page.getByRole('row', { name: /Antônio · 4 visitas/ });
  await expect(antonio).toContainText('R$ 30,00');
  await expect(antonio).toContainText('R$ 100,00');
  await expect(antonio).toContainText('-R$ 7,20');
  await expect(antonio).toContainText('R$ 44,80');
  await page.locator('#sim-visits').fill('0');
  await expect(page.getByRole('row', { name: /Personalizado/ })).toContainText(
    'Sem uso',
  );
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Planos e assinantes' })
    .click();
  await expect(page.locator('[data-member="joao"]')).toContainText('R$ 60,00');
  await expect(page.locator('[data-member="antonio"]')).toContainText(
    'R$ 30,00',
  );
});

test('owner costs recalculate result and private UI stays out of client and barber views', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Dashboard financeiro' })
    .click();
  const initialText = await page.getByTestId('net-result').innerText();
  const initialAmount = Number(
    initialText
      .replace(/[^0-9,.-]/g, '')
      .replaceAll('.', '')
      .replace(',', '.'),
  );
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Custos e repasses' })
    .click();
  await page.getByLabel('Aluguel (R$)', { exact: true }).fill('800');
  await page
    .getByRole('button', { name: 'Aplicar regras na simulação' })
    .click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Dashboard financeiro' })
    .click();
  const changedText = await page.getByTestId('net-result').innerText();
  const changedAmount = Number(
    changedText
      .replace(/[^0-9,.-]/g, '')
      .replaceAll('.', '')
      .replace(',', '.'),
  );
  expect(changedAmount - initialAmount).toBeCloseTo(100, 2);
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Custos e repasses' })
    .click();
  await page.getByLabel('Regra dos planos').selectOption('percentual');
  await page
    .getByRole('button', { name: 'Aplicar regras na simulação' })
    .click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Dashboard financeiro' })
    .click();
  await expect(page.getByTestId('net-result')).not.toHaveText(changedText);
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Meus ganhos' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Seu cuidado tem valor.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Dashboard financeiro' }),
  ).toHaveCount(0);
  await expect(page.getByTestId('net-result')).toHaveCount(0);
  await expect(page.locator('.photo')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Custos e repasses' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Reiniciar demo' }).click();
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Dashboard financeiro' })
    .click();
  await expect(page.getByTestId('net-result')).toHaveText(initialText);
});

test('all menus render with portraits and plan profiles cover the advertised services', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/demo.html');
  await page.evaluate(async () => {
    const photo = document.querySelector('.photo');
    if (!photo) throw new Error('Missing portrait');
    const background = getComputedStyle(photo).backgroundImage;
    if (!background.startsWith('url("data:image/png;base64,'))
      throw new Error('Missing embedded image');
    const image = new Image();
    image.src = background.slice(5, -2);
    await image.decode();
  });
  for (const role of ['Cliente', 'Empresário', 'Barbeiro']) {
    await page.getByRole('button', { name: role, exact: true }).click();
    const views = await page
      .locator('#menu [data-view]')
      .evaluateAll((items) =>
        items.map((item) => item.getAttribute('data-view')),
      );
    for (const view of views) {
      await page.locator(`#menu [data-view="${view}"]`).click();
      await expect(page.locator('.photo').first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  for (const [plan, profile] of [
    ['Cabelo em dia', 'joao'],
    ['Barba impecável', 'm4'],
    ['Ross completo', 'carlos'],
  ]) {
    await page
      .locator('#menu')
      .getByRole('button', { name: 'Planos mensais' })
      .click();
    await page
      .getByRole('button', { name: `Experimentar plano ${plan}` })
      .click();
    await expect(page.getByLabel('Perfil de demonstração')).toHaveValue(
      profile!,
    );
    await expect(page.locator('.summary .total')).toContainText('R$ 0,00');
  }
  expect(errors).toEqual([]);
});

test('dark theme survives navigation and financial explanations open by keyboard', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: /Modo claro/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /Modo escuro/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Dashboard financeiro' })
    .click();
  await page
    .getByRole('button', { name: 'Entender: Receita do mês', exact: true })
    .focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page.getByRole('tooltip')).toContainText(
    'Mensalidades vencidas não entram',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).not.toBeVisible();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Custos e repasses' })
    .click();
  await page
    .getByRole('button', { name: 'Entender: Aluguel', exact: true })
    .click();
  await expect(page.getByRole('tooltip')).toContainText(
    'independentemente de quantos clientes',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Modo claro/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('owner edits counts and average price, and unpaid profiles cannot book until regularized', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByLabel('Perfil de demonstração').selectOption('vencido');
  await page.getByRole('button', { name: 'Qui 29 OUT' }).click();
  await page.getByRole('button', { name: '14:00', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Simular agendamento' }),
  ).toBeDisabled();
  await expect(page.locator('.member-banner')).toContainText(
    'Para agendar, entre em contato com a recepção.',
  );
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Planos e assinantes' })
    .click();
  await expect(
    page.locator('.stat').filter({ hasText: 'Clientes cadastrados' }),
  ).toContainText('300');
  await expect(
    page.locator('.stat').filter({ hasText: 'Em dia' }),
  ).toContainText('270');
  await expect(
    page.locator('.stat').filter({ hasText: 'Vencidas' }),
  ).toContainText('30');
  await expect(page.locator('.subscription-totals')).toContainText(
    'R$ 32.400,00',
  );
  await page.getByLabel('Buscar assinante').fill('Hugo');
  await page.getByRole('button', { name: 'Simular regularização' }).click();
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Simular agendamento' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Planos e assinantes' })
    .click();
  await page.getByLabel('Clientes · Cabelo em dia', { exact: true }).fill('80');
  await page.getByLabel('Vencidas · Cabelo em dia', { exact: true }).fill('5');
  await page
    .getByLabel('Mensalidade · Cabelo em dia (R$)', { exact: true })
    .fill('150');
  await page
    .getByRole('button', { name: 'Aplicar cenário de assinaturas' })
    .click();
  await expect(
    page.locator('.stat').filter({ hasText: 'Clientes cadastrados' }),
  ).toContainText('280');
  await expect(page.locator('.subscription-totals')).toContainText(
    'R$ 32.850,00',
  );
  await page.getByLabel('Vencidas · Cabelo em dia', { exact: true }).fill('81');
  await page
    .getByRole('button', { name: 'Aplicar cenário de assinaturas' })
    .click();
  await expect(page.getByRole('alert')).toContainText('entre zero e o total');
});

test('daily schedule has ten one-hour slots per barber without lunch overlaps', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  for (const id of ['1', '2', '3', '4', '5']) {
    await page.getByLabel('Simular outro profissional').selectOption(id);
    await expect(page.locator('.appointment')).toHaveCount(10);
    const times = await page.locator('.appointment time').allTextContents();
    expect(times).toEqual([
      '09:00',
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
    ]);
    await expect(page.locator('.info-grid')).toContainText('21:00');
  }
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await page.getByRole('button', { name: 'Qui 29 OUT' }).click();
  await expect(page.locator('[data-time="12:00"]')).toHaveCount(0);
  await expect(page.locator('[data-time="13:00"]')).toHaveCount(0);
  await page.getByRole('button', { name: '20:00', exact: true }).click();
  await page.getByRole('button', { name: 'Simular agendamento' }).click();
  await expect(page.locator('.booking-ticket')).toContainText('20:00');
  await expect(page.locator('.booking-ticket')).toContainText('60 minutos');
});

test('base salary is included once in business expenses and own remuneration', async ({
  page,
}) => {
  await page.goto('/demo.html');
  const amount = async () =>
    Number(
      (await page.getByTestId('net-result').innerText())
        .replace(/[^0-9,.-]/g, '')
        .replaceAll('.', '')
        .replace(',', '.'),
    );
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Dashboard financeiro' })
    .click();
  const initial = await amount();
  await expect(
    page.locator('.ledger-line').filter({ hasText: 'Salários base da equipe' }),
  ).toContainText('R$ 7.500,00');
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Custos e repasses' })
    .click();
  await page
    .getByLabel('Salário base · Rafael Lima (R$)', { exact: true })
    .fill('1800');
  await page
    .getByRole('button', { name: 'Aplicar regras na simulação' })
    .click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Dashboard financeiro' })
    .click();
  expect(await amount()).toBeCloseTo(initial - 300, 2);
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Meus ganhos' })
    .click();
  await expect(page.locator('.pay-breakdown')).toContainText(
    'Salário base: R$ 1.800,00',
  );
  await expect(page.locator('.pay-breakdown')).toContainText('Comissões:');
  await expect(page.locator('tbody tr')).toHaveCount(20);
  await page
    .getByRole('button', { name: 'Próxima página de atendimentos' })
    .click();
  await expect(page.locator('.subscription-pagination')).toContainText(
    'Página 2',
  );
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Custos e repasses' })
    .click();
  await page.getByLabel('Modelo de remuneração').selectOption('comissao');
  await page
    .getByRole('button', { name: 'Aplicar regras na simulação' })
    .click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Dashboard financeiro' })
    .click();
  expect(await amount()).toBeCloseTo(initial + 7500, 2);
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await page
    .locator('#menu')
    .getByRole('button', { name: 'Meus ganhos' })
    .click();
  await expect(page.locator('.pay-breakdown')).toContainText(
    'Salário base: R$ 0,00',
  );
});
