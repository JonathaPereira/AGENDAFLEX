import type {
  BillingCommand,
  BillingSnapshot,
  BillingSlotsQuery,
} from '@agendaflex/shared';

export class BillingError extends Error {
  constructor(
    public readonly status: 403 | 409 | 422 | 503,
    message: string,
  ) {
    super(message);
  }
}
export interface BillingGateway {
  snapshot(token: string, slug: string): Promise<BillingSnapshot>;
  execute(token: string, slug: string, command: BillingCommand): Promise<void>;
  slots(
    token: string,
    slug: string,
    query: BillingSlotsQuery,
  ): Promise<string[]>;
}
