import { z } from 'zod';

import { listQuerySchema } from '../../common/pagination/pagination.schemas';

export const ORDER_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export const STAGE_TYPES = [
  'SURVEY',
  'DESIGN',
  'PRODUCTION',
  'INSTALLATION',
] as const;

export const orderIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const orderStageParamSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(STAGE_TYPES),
});

export const createOrderBodySchema = z.object({
  customerId: z.string().uuid(),
  number: z.number().int().positive().optional(),
  graveSiteId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  comment: z.string().trim().optional(),
  totalAmount: z.number().nonnegative().optional(),
});

export const updateOrderBodySchema = z.object({
  graveSiteId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  comment: z.string().trim().optional(),
  totalAmount: z.number().nonnegative().optional(),
});

export const orderStatusBodySchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const stageUpdateBodySchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']).optional(),
  assignedEmployeeId: z.string().uuid().optional(),
  plannedStart: z.string().datetime().optional(),
  plannedEnd: z.string().datetime().optional(),
  comment: z.string().trim().optional(),
});

export const paymentBodySchema = z.object({
  amount: z.number().positive(),
  method: z.string().trim().min(1),
  comment: z.string().trim().optional(),
});

export const orderListQuerySchema = listQuerySchema.extend({
  sortBy: z
    .enum(['createdAt', 'number', 'totalAmount'])
    .default('createdAt'),
  status: z.enum(ORDER_STATUSES).optional(),
  customerId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});