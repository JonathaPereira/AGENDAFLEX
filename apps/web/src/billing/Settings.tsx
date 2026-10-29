import { useState, type FormEvent } from 'react';
import type { BillingCommand, BillingSnapshot } from '@agendaflex/shared';
import type { Execute } from './types';
import { money, coverageNames } from './format';
export function Settings({
  data,
  execute,
  busy,
}: {
  data: BillingSnapshot;
  execute: Execute;
  busy: boolean;
}) {
  const [topic, setTopic] = useState<'plan' | 'service' | 'barber'>('plan');
  const [editing, setEditing] = useState('');
  const items =
    topic === 'plan'
      ? data.plans
      : topic === 'service'
        ? data.services
        : data.barbers;
  const item = items.find((i) => i.id === editing);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const f = new FormData(element);
    const base = {
      ...(item ? { id: item.id } : {}),
      name: String(f.get('name')),
      active: f.get('active') === 'on',
    };
    let command: BillingCommand;
    if (topic === 'barber')
      command = {
        action: 'save_barber',
        ...base,
        userId: String(f.get('userId')),
      };
    else {
      const priceCents = Math.round(Number(f.get('price')) * 100);
      if (topic === 'plan')
        command = {
          action: 'save_plan',
          ...base,
          priceCents,
          coverage: String(f.get('coverage')) as 'hair' | 'beard' | 'combo',
        };
      else
        command = {
          action: 'save_service',
          ...base,
          priceCents,
          durationMinutes: Number(f.get('duration')),
          category: String(f.get('category')) as
            'hair' | 'beard' | 'combo' | 'other',
        };
    }
    if (await execute(command)) {
      setEditing('');
      element.reset();
    }
  }
  return (
    <section>
      <h2>Configurar negócio</h2>
      <nav aria-label="Tópicos de configuração" className="billing-tabs">
        {(
          [
            ['plan', 'Planos'],
            ['service', 'Serviços'],
            ['barber', 'Barbeiros'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={topic === value}
            onClick={() => {
              setTopic(value);
              setEditing('');
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="billing-settings">
        <div className="billing-cards">
          {items.map((i) => (
            <article key={i.id} className="billing-card">
              <h3>{i.name}</h3>
              <p>{i.active ? 'Ativo' : 'Inativo'}</p>
              {'priceCents' in i && <p>{money(i.priceCents)}</p>}
              {'durationMinutes' in i && <p>{i.durationMinutes} minutos</p>}
              <button
                onClick={() => setEditing(i.id)}
                aria-label={`Editar ${i.name}`}
              >
                ✎ Editar
              </button>
            </article>
          ))}
        </div>
        <form
          className="billing-card"
          key={`${topic}-${editing}`}
          onSubmit={(e) => void submit(e)}
        >
          <h3>{item ? 'Editar cadastro' : 'Novo cadastro'}</h3>
          <label>
            Nome
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={item?.name || ''}
            />
          </label>
          {topic !== 'barber' && (
            <label>
              Preço em reais
              <input
                name="price"
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                required
                defaultValue={
                  item && 'priceCents' in item ? item.priceCents / 100 : 120
                }
              />
            </label>
          )}
          {topic === 'plan' && (
            <label>
              Cobertura
              <select
                name="coverage"
                aria-label="Cobertura"
                defaultValue={
                  item && 'coverage' in item ? item.coverage : 'combo'
                }
              >
                <option value="hair">Cabelo</option>
                <option value="beard">Barba</option>
                <option value="combo">Cabelo + barba</option>
              </select>
              <small>
                Alterações valem para novas mensalidades. Faturas emitidas
                preservam preço e cobertura.
              </small>
            </label>
          )}
          {topic === 'service' && (
            <>
              <label>
                Tipo de serviço
                <select
                  name="category"
                  defaultValue={
                    item && 'category' in item ? item.category : 'hair'
                  }
                >
                  {Object.entries(coverageNames).map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Duração em minutos
                <input
                  name="duration"
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  required
                  defaultValue={
                    item && 'durationMinutes' in item
                      ? item.durationMinutes
                      : 60
                  }
                />
              </label>
            </>
          )}
          {topic === 'barber' && (
            <label>
              Conta vinculada
              <select
                name="userId"
                required
                defaultValue={item && 'userId' in item ? item.userId : ''}
                disabled={Boolean(item)}
              >
                {!item && (
                  <option value="">Selecione uma conta da equipe</option>
                )}
                {data.team.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.email}
                  </option>
                ))}
              </select>
              {item && 'userId' in item && (
                <input type="hidden" name="userId" value={item.userId} />
              )}
              <small>
                O empresário pode cadastrar a própria conta como barbeiro. Novos
                funcionários precisam de vínculo autorizado antes de aparecer
                aqui.
              </small>
            </label>
          )}
          <label className="billing-checkbox">
            <input
              type="checkbox"
              name="active"
              defaultChecked={item?.active ?? true}
            />{' '}
            Ativo
          </label>
          <div className="billing-actions">
            <button disabled={busy}>Salvar cadastro</button>
            {item && (
              <button type="button" onClick={() => setEditing('')}>
                Novo cadastro
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
