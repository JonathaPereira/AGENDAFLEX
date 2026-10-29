import { useEffect, useState, type FormEvent } from 'react';
import { billingSlotsSchema, type BillingSnapshot } from '@agendaflex/shared';
import type { Execute } from './types';
import { useAuth } from '../auth/AuthProvider';
import { apiUrl, responseJson } from './useBilling';
import { time, money, statusNames, today, maxDate } from './format';
export function AppointmentList({
  data,
  execute,
  busy,
  title,
}: {
  data: BillingSnapshot;
  execute: Execute;
  busy: boolean;
  title?: string;
}) {
  const work = data.role === 'owner' || data.role === 'staff';
  return (
    <section>
      <h2>
        {title ||
          (data.role === 'owner'
            ? 'Agenda do estabelecimento'
            : data.role === 'staff'
              ? 'Minha agenda'
              : 'Meus agendamentos')}
      </h2>
      {!data.appointments.length && (
        <p className="billing-empty">Nenhum agendamento registrado.</p>
      )}
      <div className="billing-cards">
        {data.appointments.map((a) => (
          <article className="billing-card" key={a.id}>
            <span className={`billing-status ${a.status}`}>
              {statusNames[a.status]}
            </span>
            <h3>{a.serviceName}</h3>
            <p>
              {time(a.startsAt)} · {a.barberName}
            </p>
            {work && <p>Cliente: {a.customerName}</p>}
            <p>
              {a.mode === 'plan'
                ? 'Incluído no plano'
                : `Avulso: ${money(a.priceCents)} · pagar na recepção`}
            </p>
            {a.status === 'awaiting_renewal' && (
              <small>
                A vaga está reservada. A renovação precisa estar confirmada
                antes do atendimento.
              </small>
            )}
            {['confirmed', 'awaiting_renewal'].includes(a.status) && (
              <div className="billing-actions">
                {work && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void execute({ action: 'check_in', appointmentId: a.id })
                    }
                  >
                    Iniciar atendimento
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() =>
                    void execute({ action: 'cancel', appointmentId: a.id })
                  }
                >
                  Cancelar agendamento
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function BookingForm({
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
  const { session } = useAuth();
  const [serviceId, setServiceId] = useState(''),
    [barberId, setBarberId] = useState(''),
    [date, setDate] = useState(today),
    [startsAt, setStartsAt] = useState(''),
    [slots, setSlots] = useState<string[]>([]),
    [slotError, setSlotError] = useState(''),
    [loading, setLoading] = useState(false),
    [revision, setRevision] = useState(0),
    [mode, setMode] = useState<'plan' | 'one_off'>('plan');
  useEffect(() => {
    setStartsAt('');
    setSlots([]);
    setSlotError('');
    if (!serviceId || !barberId || !session) return;
    const controller = new AbortController();
    setLoading(true);
    const query = new URLSearchParams({ serviceId, barberId, date });
    void fetch(`${apiUrl}/shops/${encodeURIComponent(slug)}/slots?${query}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    })
      .then(responseJson)
      .then((result) => {
        const rows = billingSlotsSchema.parse(
          (result as { slots: unknown }).slots,
        );
        if (!controller.signal.aborted) setSlots(rows);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSlotError(
            'Não foi possível consultar os horários. Selecione novamente a data.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [serviceId, barberId, date, session, revision, slug]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await execute({
      action: 'book',
      serviceId,
      barberId,
      startsAt,
      mode,
      requestId: crypto.randomUUID(),
    });
    setRevision((v) => v + 1);
  }
  return (
    <section className="billing-card">
      <h2>Seu próximo cuidado</h2>
      <p>Escolha serviço, profissional e um horário nos próximos 15 dias.</p>
      <form onSubmit={(e) => void submit(e)} className="billing-form-grid">
        <label>
          Serviço
          <select
            aria-label="Serviço"
            required
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">Escolha um serviço</option>
            {data.services
              .filter((s) => s.active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.durationMinutes} min · {money(s.priceCents)}
                </option>
              ))}
          </select>
        </label>
        <label>
          Como deseja agendar?
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="plan">Pelo meu plano</option>
            <option value="one_off">Avulso</option>
          </select>
          <small>
            Plano: serviço coberto pela mensalidade. Avulso: valor do serviço
            pago à parte na recepção.
          </small>
        </label>
        <label>
          Profissional
          <select
            aria-label="Profissional"
            required
            value={barberId}
            onChange={(e) => setBarberId(e.target.value)}
          >
            <option value="">Escolha um barbeiro</option>
            {data.barbers
              .filter((b) => b.active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Data
          <input
            type="date"
            required
            min={today()}
            max={maxDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Horário disponível
          <select
            aria-label="Horário disponível"
            required
            disabled={loading || !slots.length}
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          >
            <option value="">
              {loading ? 'Consultando…' : 'Escolha um horário'}
            </option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {new Date(s).toLocaleTimeString('pt-BR', {
                  timeZone: 'America/Fortaleza',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </option>
            ))}
          </select>
        </label>
        <button disabled={busy || loading || !startsAt}>
          Reservar horário
        </button>
      </form>
      {slotError && <p role="alert">{slotError}</p>}
      {!loading && serviceId && barberId && !slots.length && !slotError && (
        <p role="status">Não há horários disponíveis nesta data.</p>
      )}
      <small>
        Horário de Fortaleza · 09h–21h, com pausa das 13h às 15h. A
        disponibilidade é conferida novamente na confirmação.
      </small>
    </section>
  );
}
