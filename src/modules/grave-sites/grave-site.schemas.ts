import { z } from 'zod';

import { listQuerySchema } from '../../common/pagination/pagination.schemas';

export const graveSiteIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const burialIdParamSchema = z.object({
  id: z.string().uuid(),
  burialId: z.string().uuid(),
});

export const createGraveSiteBodySchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().trim().min(1),
  address: z.string().trim().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  size: z.string().trim().optional(),
  features: z.string().trim().optional(),
});

export const updateGraveSiteBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  size: z.string().trim().optional(),
  features: z.string().trim().optional(),
});

export const burialBodySchema = z.object({
  fullName: z.string().trim().min(1),
  birthDate: z.string().datetime().optional(),
  deathDate: z.string().datetime().optional(),
  comment: z.string().trim().optional(),
});

export const graveSiteListQuerySchema = listQuerySchema.extend({
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  customerId: z.string().uuid().optional(),
});