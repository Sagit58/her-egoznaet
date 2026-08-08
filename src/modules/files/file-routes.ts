import type { FastifyInstance } from 'fastify';

import type { AuthGuard } from '../../common/auth/auth-guard';
import { AppError } from '../../common/errors/app-error';
import {
  fileIdParamSchema,
  fileFieldsSchema,
  fileListQuerySchema,
} from './file.schemas';
import type { FileService } from './file-service';

export const registerFileRoutes = (
  app: FastifyInstance,
  service: FileService,
  guard: AuthGuard,
): void => {
  app.post(
    '/api/v1/files',
    { preHandler: guard.requirePermission('file.upload') },
    async (request, reply) => {
      const data = await request.file();

      if (!data) {
        throw AppError.badRequest('File is missing');
      }

      const fields = fileFieldsSchema.safeParse({
        category: data.fields.category?.value,
        orderId: data.fields.orderId?.value,
        customerId: data.fields.customerId?.value,
      });

      if (!fields.success) {
        throw AppError.badRequest(
          'Invalid fields',
          fields.error.flatten().fieldErrors,
        );
      }

      const context = request.authContext;

      if (!context) {
        throw AppError.unauthorized('Not authenticated');
      }

      const buffer = await data.toBuffer();

      const file = await service.upload({
        buffer,
        fileName: data.filename ?? 'file',
        mimeType: data.mimetype,
        category: fields.data.category,
        ownerId: context.employeeId,
        orderId: fields.data.orderId,
        customerId: fields.data.customerId,
      });

      return reply.status(201).send(file);
    },
  );

  app.get(
    '/api/v1/files',
    { preHandler: guard.requirePermission('file.list') },
    async (request) => {
      const parsed = fileListQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid query parameters',
          parsed.error.flatten().fieldErrors,
        );
      }

      const query = parsed.data;

      return service.list({
        page: query.page,
        pageSize: query.pageSize,
        orderId: query.orderId,
        customerId: query.customerId,
        category: query.category,
      });
    },
  );

  app.get(
    '/api/v1/files/:id/download',
    { preHandler: guard.requirePermission('file.download') },
    async (request) => {
      const params = fileIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      return service.getDownloadUrl(params.data.id);
    },
  );

  app.delete(
    '/api/v1/files/:id',
    { preHandler: guard.requirePermission('file.delete') },
    async (request, reply) => {
      const params = fileIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      await service.remove(params.data.id);

      return reply.status(204).send();
    },
  );
};