import { z } from 'zod';

import { listQuerySchema } from '../../common/pagination/pagination.schemas';
import { ROLES } from '../../common/rbac/rbac.types';

export const employeeIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createEmployeeBodySchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  middleName: z.string().trim().optional(),
  telegramId: z.string().regex(/^\d{5,15}$/).optional(),
  phone: z.string().trim().optional(),
  role: z.enum(ROLES),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const updateEmployeeBodySchema = createEmployeeBodySchema.partial();

export const employeeListQuerySchema = listQuerySchema.extend({
  sortBy: z
    .enum(['createdAt', 'firstName', 'lastName', 'role'])
    .default('createdAt'),
  role: z.enum(ROLES).optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .transform((value) => value === 'true')
    .optional(),
});

export type CreateEmployeeBody = z.infer<typeof createEmployeeBodySchema>;
export type UpdateEmployeeBody = z.infer<typeof updateEmployeeBodySchema>;
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;