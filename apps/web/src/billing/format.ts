export const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const day = (date: string) =>
  new Date(`${date}T12:00:00-03:00`).toLocaleDateString('pt-BR');
export const lastDay = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return day(d.toISOString().slice(0, 10));
};
export const time = (date: string) =>
  new Date(date).toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
    dateStyle: 'short',
    timeStyle: 'short',
  });
export const methodNames = {
  pix: 'Pix',
  credit: 'Crédito',
  debit: 'Débito',
  cash: 'Dinheiro',
};
export const statusNames = {
  pending: 'Aguardando pagamento',
  overdue: 'Ciclo pendente',
  paid: 'Em dia',
  refunded: 'Reembolsado',
  confirmed: 'Confirmado',
  awaiting_renewal: 'Vaga reservada · aguarda renovação',
  in_service: 'Em atendimento',
  cancelled: 'Cancelado',
  approved: 'Aprovado',
  declined: 'Não aprovado',
};
export const coverageNames: Record<string, string> = {
  hair: 'Cabelo',
  beard: 'Barba',
  combo: 'Cabelo + barba',
  other: 'Outro serviço',
};
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const maxDate = () => {
  const d = new Date(`${today()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 14);
  return d.toISOString().slice(0, 10);
};
