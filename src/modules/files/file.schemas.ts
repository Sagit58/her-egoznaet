import { z } from 'zod';

import { listQuerySchema } from '../../common/pagination/pagination.schemas';

export const FILE_CATEGORIES = [
  'SURVEY_PHOTO',
  'DESIGN',
  'PRODUCTION_PHOTO',
  'INSTALLATION_PHOTO',
  'DOCUMENT',
] as const;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const fileIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const fileFieldsSchema = z.object({
  category: z.enum(FILE_CATEGORIES),
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});

export const fileListQuerySchema = listQuerySchema.extend({
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  category: z.enum(FILE_CATEGORIES).optional(),
});