import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { BillingSnapshot } from '@agendaflex/shared';
import type { Invoice, Execute } from './types';
import { PaymentTest } from './PaymentTest';
import { money, day, lastDay, time, methodNames, statusNames } from './format';
function RefundDialog({
  invoice,
  busy,
  execute,
  close,
}: {
  invoice: Invoice;
  busy: boolean;
  execute: Execute;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [failure, setFailure] = useState('');
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFailure('');
    if (
      await execute({
        action: 'refund',
        invoiceId: invoice.id,
        reason: String(form.get('reason') || ''),
      })
    )
      close();
    else
      setFailure(
        'Não foi possível concluir o reembolso. Tente novamente em instantes.',
      );
  }
  return (
    <dialog
      ref={ref}
      className="billing-dialog"
      aria-labelledby="refund-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else close();
      }}
    >
      <h2 id="refund-title">Confirmar reembolso de teste</h2>
      <p>
        Devolver integralmente <strong>{money(invoice.amountCents)}</strong> da
        mensalidade de {invoice.customerName}?
      </p>
      <p>
        O ciclo ficará reembolsado e a emissão de novas mensalidades será
        encerrada. As reservas futuras sem cobertura de outra mensalidade paga
        serão canceladas. Esta simulação não devolve dinheiro real.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        {failure && <p role="alert">{failure}</p>}
        <label>
          Motivo do reembolso
          <textarea name="reason" required minLength={3} maxLength={300} />
        </label>
        <div className="billing-actions">
          <button type="button" disabled={busy} onClick={close}>
            Voltar
          </button>
          <button className="billing-danger" disabled={busy}>
            Confirmar reembolso
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function Invoices({
  data,
  execute,
  busy,
  owner = false,
}: {
  data: BillingSnapshot;
  execute: Execute;
  busy: boolean;
  owner?: boolean;
}) {
  const [refund, setRefund] = useState<Invoice | null>(null),
    [filter, setFilter] = useState('all');
  const invoices = data.invoices.filter(
    (i) => filter === 'all' || i.status === filter,
  );
  return (
    <section>
      <div className="billing-section-heading">
        <h2>
          {owner ? 'Mensalidades e pagamentos' : 'Meu plano e faturamento'}
        </h2>
        <label>
          Filtrar mensalidades
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todas</option>
            <option value="paid">Em dia</option>
            <option value="pending">Aguardando pagamento</option>
            <option value="overdue">Ciclo pendente</option>
            <option value="refunded">Reembolsadas</option>
          </select>
        </label>
      </div>
      {!invoices.length && (
        <p className="billing-empty">Nenhuma mensalidade neste filtro.</p>
      )}
      <div className="billing-cards">
        {invoices.map((i) => (
          <article className="billing-card" key={i.id}>
            <span className={`billing-status ${i.status}`}>
              {statusNames[i.status]}
            </span>
            <h3>{owner ? i.customerName : i.planName}</h3>
            {owner && <p>{i.planName}</p>}
            <strong className="billing-amount">{money(i.amountCents)}</strong>
            <p>
              Ciclo: {day(i.periodStart)} até {lastDay(i.periodEnd)}
            </p>
            <p>Data prevista de pagamento: {day(i.dueOn)}</p>
            {i.paidVia && <p>Forma de pagamento: {methodNames[i.paidVia]}</p>}
            <small>
              Não há débito automático de cartão. Esta é uma mensalidade de
              teste.
            </small>
            {['pending', 'overdue'].includes(i.status) && (
              <>
                {data.role !== 'staff' && (
                  <PaymentTest invoice={i} execute={execute} busy={busy} />
                )}{' '}
                {(owner || data.role === 'staff') && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void execute({ action: 'receive_cash', invoiceId: i.id })
                    }
                  >
                    Registrar recebimento em dinheiro · teste
                  </button>
                )}
              </>
            )}
            {owner && i.status === 'paid' && (
              <button
                className="billing-danger"
                disabled={busy}
                onClick={() => setRefund(i)}
              >
                Reembolsar mensalidade
              </button>
            )}
          </article>
        ))}
      </div>
      {refund && owner && (
        <RefundDialog
          invoice={refund}
          execute={execute}
          busy={busy}
          close={() => setRefund(null)}
        />
      )}
      {data.refunds.length > 0 && (
        <details>
          <summary>Histórico de reembolsos</summary>
          {data.refunds.map((r) => (
            <p key={r.id}>
              {time(r.refundedAt)} · {money(r.amountCents)} · {r.reason}
            </p>
          ))}
        </details>
      )}
    </section>
  );
}
