import { useState } from 'react';
import type { BillingSnapshot } from '@agendaflex/shared';
import { money, today, methodNames } from './format';
export function Finance({ data }: { data: BillingSnapshot }) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const invoices = data.invoices.filter((i) => i.periodStart.startsWith(month));
  const ids = new Set(invoices.map((i) => i.id));
  const payments = data.payments.filter(
    (p) => ids.has(p.invoiceId) && p.status === 'approved',
  );
  const refunds = data.refunds.filter((r) => ids.has(r.invoiceId));
  const gross = payments.reduce((s, p) => s + p.amountCents, 0),
    returned = refunds.reduce((s, r) => s + r.amountCents, 0);
  const refundedIds = new Set(refunds.map((r) => r.invoiceId));
  const paidCustomers = new Set(
    invoices.filter((i) => i.status === 'paid').map((i) => i.customerId),
  ).size;
  const metrics = [
    [
      'Recebido bruto',
      money(gross),
      'Soma dos pagamentos de teste aprovados para os ciclos selecionados.',
    ],
    [
      'Reembolsado',
      money(returned),
      'Valores devolvidos em teste. O recebimento original é preservado no histórico.',
    ],
    [
      'Saldo após reembolsos',
      money(gross - returned),
      'Recebimentos menos reembolsos. Não é lucro: despesas, taxas e comissões não estão incluídas.',
    ],
    [
      'Assinantes com ciclo pago',
      String(paidCustomers),
      'Clientes distintos com mensalidade paga no mês selecionado.',
    ],
    [
      'Ciclos pendentes',
      String(invoices.filter((i) => i.status === 'overdue').length),
      'Ciclos já iniciados com pagamento pendente e data prevista ultrapassada.',
    ],
  ];
  return (
    <section>
      <div className="billing-section-heading">
        <h2>Faturamento do empresário</h2>
        <label>
          Mês do ciclo
          <input
            type="month"
            required
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>
      <p>
        Todos os valores abaixo são de teste, agrupados pelo mês de cobertura da
        mensalidade.
      </p>
      <div className="billing-metrics">
        {metrics.map(([title, value, help]) => (
          <article className="billing-card" key={title}>
            <h3>{title}</h3>
            <strong>{value}</strong>
            <details>
              <summary>Como é calculado?</summary>
              <p>{help}</p>
            </details>
          </article>
        ))}
      </div>
      <h3>Recebimentos por forma de pagamento</h3>
      <div className="billing-metrics">
        {Object.entries(methodNames).map(([method, name]) => (
          <article className="billing-card" key={method}>
            <h3>{name}</h3>
            <strong>
              {money(
                payments
                  .filter(
                    (p) => p.method === method && !refundedIds.has(p.invoiceId),
                  )
                  .reduce((s, p) => s + p.amountCents, 0),
              )}
            </strong>
            <small>Após reembolsos de teste.</small>
          </article>
        ))}
      </div>
    </section>
  );
}
