import { useState } from 'react';
import type { Invoice, Execute } from './types';
export function PaymentTest({
  invoice,
  execute,
  busy,
}: {
  invoice: Invoice;
  execute: Execute;
  busy: boolean;
}) {
  const [method, setMethod] = useState<'pix' | 'credit' | 'debit'>('pix');
  const [result, setResult] = useState<'approved' | 'pending' | 'declined'>(
    'approved',
  );
  return (
    <div className="billing-payment-test">
      <label>
        Forma de pagamento
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof method)}
        >
          <option value="pix">Pix</option>
          <option value="credit">Cartão de crédito</option>
          <option value="debit">Cartão de débito</option>
        </select>
      </label>
      <label>
        Resultado do teste
        <select
          value={result}
          onChange={(e) => setResult(e.target.value as typeof result)}
        >
          <option value="approved">Aprovado</option>
          <option value="pending">Pendente</option>
          <option value="declined">Não aprovado</option>
        </select>
      </label>
      <button
        disabled={busy}
        onClick={() =>
          void execute({
            action: 'pay_test',
            invoiceId: invoice.id,
            method,
            result,
          })
        }
      >
        Simular pagamento
      </button>
      <small>
        Não informe dados de cartão. Não há QR Code, débito ou transferência
        real neste ambiente.
      </small>
    </div>
  );
}
