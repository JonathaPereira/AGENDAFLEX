import type { BillingCommand, BillingSnapshot } from '@agendaflex/shared';
export type Execute = (command: BillingCommand) => Promise<boolean>;
export type Invoice = BillingSnapshot['invoices'][number];
