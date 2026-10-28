import { z } from 'zod';
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('agendaflex-api'),
  version: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
// Vocabulary only: no authorization decisions are made from client-side roles.
export const tenantRoleSchema = z.enum(['owner', 'manager', 'staff']);
export type TenantRole = z.infer<typeof tenantRoleSchema>;
