import type { AccountResponse } from '@agendaflex/shared';
export interface IdentityGateway {
  accountForToken(accessToken: string): Promise<AccountResponse | null>;
}
