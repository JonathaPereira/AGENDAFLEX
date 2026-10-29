import { z } from 'zod';

export const bookingUnavailableMessage =
  'Não foi possível agendar neste momento. Por favor, entre em contato com a recepção.';
export const paymentMethodSchema = z.enum(['pix', 'credit', 'debit', 'cash']);
export const serviceCategorySchema = z.enum([
  'hair',
  'beard',
  'combo',
  'other',
]);
const id = z.string().uuid();
const name = z.string().trim().min(2).max(100);
const cents = z.number().int().min(1).max(100_000_000);
export const billingCommandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('join'), name }).strict(),
  z
    .object({
      action: z.literal('save_plan'),
      id: id.optional(),
      name,
      priceCents: cents,
      coverage: z.enum(['hair', 'beard', 'combo']),
      active: z.boolean().default(true),
    })
    .strict(),
  z
    .object({
      action: z.literal('save_service'),
      id: id.optional(),
      name,
      priceCents: cents,
      category: serviceCategorySchema,
      durationMinutes: z.number().int().min(15).max(180).multipleOf(15),
      active: z.boolean().default(true),
    })
    .strict(),
  z
    .object({
      action: z.literal('save_barber'),
      id: id.optional(),
      name,
      userId: id,
      active: z.boolean().default(true),
    })
    .strict(),
  z.object({ action: z.literal('subscribe'), planId: id }).strict(),
  z
    .object({
      action: z.literal('pay_test'),
      invoiceId: id,
      method: z.enum(['pix', 'credit', 'debit']),
      result: z.enum(['approved', 'pending', 'declined']),
    })
    .strict(),
  z.object({ action: z.literal('receive_cash'), invoiceId: id }).strict(),
  z
    .object({
      action: z.literal('refund'),
      invoiceId: id,
      reason: z.string().trim().min(3).max(300),
    })
    .strict(),
  z
    .object({
      action: z.literal('book'),
      serviceId: id,
      barberId: id,
      startsAt: z.string().datetime({ offset: true }),
      mode: z.enum(['plan', 'one_off']),
      requestId: id,
    })
    .strict(),
  z.object({ action: z.literal('cancel'), appointmentId: id }).strict(),
  z.object({ action: z.literal('check_in'), appointmentId: id }).strict(),
]);
export type BillingCommand = z.infer<typeof billingCommandSchema>;
export const billingSlotsQuerySchema = z
  .object({
    date: z.string().date(),
    barberId: id,
    serviceId: id,
  })
  .strict();
export const billingSlotsSchema = z.array(
  z.string().datetime({ offset: true }),
);
export type BillingSlotsQuery = z.infer<typeof billingSlotsQuerySchema>;
export const shopSlugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/);
export const billingSnapshotSchema = z.object({
  mode: z.literal('test'),
  shop: z.object({ id, name: z.string(), slug: z.string() }),
  role: z.enum(['owner', 'manager', 'staff', 'customer']),
  customer: z.object({ id, name: z.string(), email: z.string() }).nullable(),
  team: z.array(z.object({ userId: id, email: z.string() })),
  plans: z.array(
    z.object({
      id,
      name: z.string(),
      priceCents: cents,
      coverage: z.string(),
      active: z.boolean(),
    }),
  ),
  services: z.array(
    z.object({
      id,
      name: z.string(),
      priceCents: cents,
      durationMinutes: z.number(),
      category: z.string(),
      active: z.boolean(),
    }),
  ),
  barbers: z.array(
    z.object({ id, userId: id, name: z.string(), active: z.boolean() }),
  ),
  subscription: z.object({ id, planId: id }).nullable(),
  invoices: z.array(
    z.object({
      id,
      customerId: id,
      customerName: z.string(),
      planName: z.string(),
      amountCents: cents,
      periodStart: z.string(),
      periodEnd: z.string(),
      dueOn: z.string(),
      status: z.enum(['pending', 'overdue', 'paid', 'refunded']),
      paidVia: paymentMethodSchema.nullable(),
    }),
  ),
  payments: z.array(
    z.object({
      id,
      invoiceId: id,
      amountCents: cents,
      method: paymentMethodSchema,
      status: z.enum(['approved', 'pending', 'declined']),
      receivedAt: z.string(),
    }),
  ),
  refunds: z.array(
    z.object({
      id,
      invoiceId: id,
      amountCents: cents,
      reason: z.string(),
      refundedAt: z.string(),
    }),
  ),
  appointments: z.array(
    z.object({
      id,
      customerName: z.string(),
      serviceName: z.string(),
      barberName: z.string(),
      barberId: id,
      startsAt: z.string(),
      endsAt: z.string(),
      status: z.enum([
        'confirmed',
        'awaiting_renewal',
        'in_service',
        'cancelled',
      ]),
      mode: z.enum(['plan', 'one_off']),
      priceCents: z.number().int().nonnegative(),
    }),
  ),
});
export type BillingSnapshot = z.infer<typeof billingSnapshotSchema>;
