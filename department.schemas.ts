import { z } from 'zod';

import { listQuerySchema } from '../../common/pagination/pagination.schemas';

export const departmentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createDepartmentBodySchema = z.object({
  name: z.string().trim().min(1),
  branchId: z.string().uuid().optional(),
});

export const updateDepartmentBodySchema =
  createDepartmentBodySchema.partial();

export const departmentListQuerySchema = listQuerySchema.extend({
  branchId: z.string().uuid().optional(),
});