import type { FormEvent } from 'react';
import type { BillingSnapshot } from '@agendaflex/shared';
import type { Execute } from './types';
import { money, coverageNames } from './format';
import { BookingForm, AppointmentList } from './Appointments';
import { Invoices } from './Invoices';
export function CustomerArea({
  data,
  slug,
  execute,
  busy,
}: {
  data: BillingSnapshot;
  slug: string;
  execute: Execute;
  busy: boolean;
}) {
  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    await execute({ action: 'join', name: String(f.get('name')) });
  }
  return (
    <>
      {!data.customer ? (
        <form className="billing-card" onSubmit={(e) => void join(e)}>
          <h2>Bem-vindo à Ross.</h2>
          <p>
            Complete seu nome para acessar os planos e agendamentos deste
            estabelecimento.
          </p>
          <label>
            Seu nome
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <button disabled={busy}>Concluir meu cadastro</button>
        </form>
      ) : (
        <>
          <h2>Bem-vindo, {data.customer.name}.</h2>
          <BookingForm data={data} slug={slug} execute={execute} busy={busy} />
          <AppointmentList data={data} execute={execute} busy={busy} />
        </>
      )}
      <section>
        <h2>Planos mensais</h2>
        <p>
          Os ciclos vão do primeiro dia do mês ao primeiro dia do mês seguinte.
          A renovação pode ser preparada com antecedência.
        </p>
        <div className="billing-cards">
          {data.plans
            .filter((p) => p.active)
            .map((p) => (
              <article className="billing-card" key={p.id}>
                <h3>{p.name}</h3>
                <strong className="billing-amount">
                  {money(p.priceCents)} / mês
                </strong>
                <p>{coverageNames[p.coverage]}</p>
                {data.subscription?.planId === p.id && (
                  <span className="billing-status">Seu plano</span>
                )}
                <button
                  disabled={
                    busy ||
                    !data.customer ||
                    Boolean(
                      data.subscription && data.subscription.planId !== p.id,
                    )
                  }
                  onClick={() =>
                    void execute({ action: 'subscribe', planId: p.id })
                  }
                >
                  {data.subscription?.planId === p.id
                    ? 'Gerar mensalidade ou renovação'
                    : 'Escolher plano'}
                </button>
              </article>
            ))}
        </div>
        {!data.plans.length && (
          <p className="billing-empty">
            A recepção ainda não publicou os planos.
          </p>
        )}
      </section>
      <Invoices data={data} execute={execute} busy={busy} />
    </>
  );
}
