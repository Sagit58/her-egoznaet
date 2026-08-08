import { z } from 'zod';

import { listQuerySchema } from '../../common/pagination/pagination.schemas';

export const branchIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createBranchBodySchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export const updateBranchBodySchema = createBranchBodySchema.partial();

export const branchListQuerySchema = listQuerySchema.extend({});