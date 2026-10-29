import { z } from 'zod';
export * from './billing.js';
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('agendaflex-api'),
  version: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
// Vocabulary only: no authorization decisions are made from client-side roles.
export const tenantRoleSchema = z.enum(['owner', 'manager', 'staff']);
export type TenantRole = z.infer<typeof tenantRoleSchema>;

export const publicSupabaseKeySchema = z
  .string()
  .min(1)
  .refine((key) => {
    if (key.startsWith('sb_publishable_')) return true;
    if (key.startsWith('sb_secret_')) return false;
    try {
      const part = key.split('.')[1];
      if (!part) return false;
      const payload = JSON.parse(
        atob(part.replaceAll('-', '+').replaceAll('_', '/')),
      ) as { role?: unknown };
      return payload.role === 'anon';
    } catch {
      return false;
    }
  }, 'Use somente a chave pública publishable ou anon.');
export const accountResponseSchema = z.object({
  user: z.object({ id: z.string().uuid(), email: z.string().email() }),
  memberships: z.array(
    z.object({
      tenantId: z.string().uuid(),
      tenantName: z.string(),
      tenantSlug: z.string().optional(),
      role: tenantRoleSchema,
    }),
  ),
});
export type AccountResponse = z.infer<typeof accountResponseSchema>;
