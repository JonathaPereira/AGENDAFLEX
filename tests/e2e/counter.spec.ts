import { test, expect, type Page } from '@playwright/test';
const menu = (p: Page, name: string) =>
  p.locator('#menu').getByRole('button', { name, exact: true }).click();
const num = (v: string) =>
  Number(
    v
      .replace(/[^0-9,.-]/g, '')
      .replaceAll('.', '')
      .replace(',', '.'),
  );
async function login(p: Page, email: string) {
  await p
    .getByRole('button', { name: 'Simular login por e-mail', exact: true })
    .click();
  await p.getByLabel('E-mail do perfil').fill(email);
  await p.getByRole('button', { name: 'Abrir perfil de demonstração' }).click();
}
async function quick(p: Page) {
  await menu(p, 'Atendimento avulso');
  await p
    .getByLabel('Nome do cliente', { exact: true })
    .fill('Cliente Balcão Teste');
  await p.getByLabel('Celular do cliente').fill('(11) 98888-1234');
  await p.getByLabel('E-mail do cliente (opcional)').fill('balcao@example.com');
}
test('owner switches between management and own barber profile without duplicating costs', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await login(page, 'proprietario@ross.example');
  await menu(page, 'Dashboard financeiro');
  const before = await page.getByTestId('net-result').innerText();
  await page
    .getByRole('button', { name: 'Modo barbeiro', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Bom dia, Rafael.' }),
  ).toBeVisible();
  await expect(page.locator('#barber-select')).toBeHidden();
  await expect(page.locator('#menu')).not.toContainText('Dashboard financeiro');
  await menu(page, 'Meus ganhos');
  await expect(page.locator('#barber-select')).toBeHidden();
  await page.getByRole('button', { name: 'Modo gestão', exact: true }).click();
  await menu(page, 'Dashboard financeiro');
  await expect(page.getByTestId('net-result')).toHaveText(before);
  await expect(page.locator('#identity')).toContainText(
    'proprietario@ross.example',
  );
});
test('seeded customers show fictitious contact details and a reset preview without exposing passwords', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await menu(page, 'Clientes e histórico');
  await page.getByLabel('Buscar perfil de cliente').fill('João Oliveira');
  await page
    .getByRole('button', { name: 'Ver perfil', exact: true })
    .first()
    .click();
  await expect(page.locator('#main')).toContainText(
    'joao@cliente.ross.example',
  );
  await expect(page.locator('#main')).toContainText('(00) 90000-');
  await expect(page.locator('#main')).toContainText('Não consultável');
  await page
    .getByRole('button', { name: 'Simular redefinição de senha' })
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'nenhum e-mail foi enviado',
  );
  await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await page
    .getByRole('button', { name: 'Completar cadastro', exact: true })
    .click();
  const edit = page.getByRole('dialog');
  await edit
    .getByLabel('E-mail', { exact: true })
    .fill('joao.contato@example.com');
  await edit.getByLabel('Celular', { exact: true }).fill('(00) 90000-7777');
  await edit.getByRole('button', { name: 'Salvar dados do cliente' }).click();
  await expect(page.locator('#main')).toContainText('joao.contato@example.com');
  await expect(page.locator('#main')).toContainText('(00) 90000-7777');
  await expect(page.locator('.stat-value').first()).toHaveText('2');
});
test('quick cash checkout creates a client and appointment, counts revenue once and survives service completion', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await page
    .locator('.appointment')
    .filter({ has: page.locator('time', { hasText: '11:00' }) })
    .getByRole('button', { name: 'Cliente não vem/veio' })
    .click();
  await page.locator('#confirm-no-show').click();
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await menu(page, 'Dashboard financeiro');
  const before = num(await page.getByTestId('net-result').innerText());
  const revenueBefore = num(
    await page
      .locator('.ledger-line')
      .filter({ hasText: 'Avulsos e recebimentos de balcão' })
      .locator('strong')
      .innerText(),
  );
  await page.getByRole('button', { name: 'Barbeiro', exact: true }).click();
  await quick(page);
  await page
    .getByRole('button', { name: 'Revisar cadastro e pagamento' })
    .click();
  await page.getByRole('button', { name: 'Voltar sem lançar' }).click();
  await expect(page.locator('#walkin-sales article')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Revisar cadastro e pagamento' })
    .click();
  await page
    .getByRole('button', { name: 'Confirmar recebimento avulso' })
    .click();
  await expect(page.locator('#walkin-sales article')).toHaveCount(1);
  await expect(page.locator('#walkin-sales')).toContainText('Dinheiro');
  await expect(page.locator('#walkin-sales')).toContainText('Confirmado');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await menu(page, 'Dashboard financeiro');
  expect(
    num(await page.getByTestId('net-result').innerText()) - before,
  ).toBeCloseTo(51.7, 2);
  expect(
    num(
      await page
        .locator('.ledger-line')
        .filter({ hasText: 'Avulsos e recebimentos de balcão' })
        .locator('strong')
        .innerText(),
    ) - revenueBefore,
  ).toBe(55);
  await page
    .getByRole('button', { name: 'Modo barbeiro', exact: true })
    .click();
  const row = page
    .locator('.appointment')
    .filter({ hasText: 'Cliente Balcão Teste' });
  await row.getByRole('button', { name: 'Iniciar atendimento' }).click();
  await row.getByRole('button', { name: 'Concluir atendimento' }).click();
  await expect(row).toContainText('Concluído');
  await page.getByRole('button', { name: 'Modo gestão', exact: true }).click();
  await menu(page, 'Dashboard financeiro');
  expect(
    num(
      await page
        .locator('.ledger-line')
        .filter({ hasText: 'Avulsos e recebimentos de balcão' })
        .locator('strong')
        .innerText(),
    ) - revenueBefore,
  ).toBe(55);
  await menu(page, 'Clientes e histórico');
  await page
    .getByLabel('Buscar perfil de cliente')
    .fill('Cliente Balcão Teste');
  await page.getByRole('button', { name: 'Ver perfil', exact: true }).click();
  await expect(page.locator('#main')).toContainText('balcao@example.com');
  await expect(page.locator('#main')).toContainText('(11) 98888-1234');
});
test('existing client lookup avoids duplicate registration and counter screens fit mobile', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await login(page, 'barbeiro2@ross.example');
  await menu(page, 'Atendimento avulso');
  await page
    .getByLabel('Buscar cliente avulso')
    .fill('joao@cliente.ross.example');
  await page
    .getByLabel('Cliente cadastrado', { exact: true })
    .selectOption('joao');
  await page
    .getByLabel('Data do atendimento', { exact: true })
    .selectOption('29');
  await expect(page.locator('#walkin-new')).toBeHidden();
  await expect(page.getByLabel('Profissional do atendimento')).toBeDisabled();
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole('button', { name: 'Revisar cadastro e pagamento' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('João');
  await page
    .getByRole('button', { name: 'Confirmar recebimento avulso' })
    .click();
  await expect(page.locator('#walkin-sales article')).toHaveCount(1);
});

test('receives an existing completed avulso without another booking or duplicate revenue', async ({
  page,
}) => {
  await page.goto('/demo.html');
  await page.getByRole('button', { name: 'Empresário', exact: true }).click();
  await menu(page, 'Dashboard financeiro');
  const before = await page.getByTestId('net-result').innerText();
  await page
    .getByRole('button', { name: 'Modo barbeiro', exact: true })
    .click();
  const row = page
    .locator('.appointment')
    .filter({ has: page.locator('time', { hasText: '09:00' }) });
  await row
    .getByRole('button', { name: 'Receber avulso', exact: true })
    .click();
  await page.getByLabel('Recebido por', { exact: true }).selectOption('pix');
  await page
    .getByRole('button', { name: 'Confirmar pagamento do atendimento' })
    .click();
  await expect(row).toContainText('Pagamento confirmado');
  await expect(
    row.getByRole('button', { name: 'Receber avulso', exact: true }),
  ).toHaveCount(0);
  await menu(page, 'Atendimento avulso');
  await expect(page.locator('#walkin-sales article')).toHaveCount(1);
  await expect(page.locator('#walkin-sales')).toContainText('Pix');
  await page.getByRole('button', { name: 'Modo gestão', exact: true }).click();
  await menu(page, 'Dashboard financeiro');
  await expect(page.getByTestId('net-result')).toHaveText(before);
});
