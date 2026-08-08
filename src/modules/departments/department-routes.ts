import type { FastifyInstance } from 'fastify';

import type { AuthGuard } from '../../common/auth/auth-guard';
import { AppError } from '../../common/errors/app-error';
import {
  createDepartmentBodySchema,
  departmentIdParamSchema,
  departmentListQuerySchema,
  updateDepartmentBodySchema,
} from './department.schemas';
import type { DepartmentService } from './department-service';

export const registerDepartmentRoutes = (
  app: FastifyInstance,
  service: DepartmentService,
  guard: AuthGuard,
): void => {
  app.post(
    '/api/v1/departments',
    { preHandler: guard.requirePermission('department.create') },
    async (request, reply) => {
      const parsed = createDepartmentBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      const department = await service.create({
        name: body.name,
        branchId: body.branchId ?? null,
      });

      return reply.status(201).send(department);
    },
  );

  app.get(
    '/api/v1/departments',
    { preHandler: guard.requirePermission('department.list') },
    async (request) => {
      const parsed = departmentListQuerySchema.safeParse(request.query);

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
        search: query.search,
        branchId: query.branchId,
      });
    },
  );

  app.get(
    '/api/v1/departments/:id',
    { preHandler: guard.requirePermission('department.read') },
    async (request) => {
      const parsed = departmentIdParamSchema.safeParse(request.params);

      if (!parsed.success) {
        throw AppError.badRequest('Invalid id');
      }

      return service.getById(parsed.data.id);
    },
  );

  app.patch(
    '/api/v1/departments/:id',
    { preHandler: guard.requirePermission('department.update') },
    async (request) => {
      const params = departmentIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = updateDepartmentBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      return service.update(params.data.id, parsed.data);
    },
  );

  app.delete(
    '/api/v1/departments/:id',
    { preHandler: guard.requirePermission('department.delete') },
    async (request, reply) => {
      const params = departmentIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      await service.remove(params.data.id);

      return reply.status(204).send();
    },
  );
};