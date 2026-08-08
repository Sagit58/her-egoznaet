import { z } from 'zod';

import { listQuerySchema } from '../../common/pagination/pagination.schemas';

export const customerIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const contactBodySchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  relation: z.string().trim().optional(),
});

export const createCustomerBodySchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  middleName: z.string().trim().optional(),
  phone: z.string().trim().min(1),
  email: z.string().trim().optional(),
  comment: z.string().trim().optional(),
  contacts: z.array(contactBodySchema).max(20).optional(),
});

export const updateCustomerBodySchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  middleName: z.string().trim().optional(),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().optional(),
  comment: z.string().trim().optional(),
});

export const noteBodySchema = z.object({
  text: z.string().trim().min(1),
});

export const customerListQuerySchema = listQuerySchema.extend({
  sortBy: z
    .enum(['createdAt', 'firstName', 'lastName'])
    .default('createdAt'),
});

export type CreateCustomerBody = z.infer<typeof createCustomerBodySchema>;
export type UpdateCustomerBody = z.infer<typeof updateCustomerBodySchema>;