import type { FastifyInstance } from 'fastify';

import type { AuthGuard } from '../../common/auth/auth-guard';
import { AppError } from '../../common/errors/app-error';
import type { EmployeeService } from './employee-service';
import {
  createEmployeeBodySchema,
  employeeIdParamSchema,
  employeeListQuerySchema,
  updateEmployeeBodySchema,
} from './employee.schemas';

export const registerEmployeeRoutes = (
  app: FastifyInstance,
  service: EmployeeService,
  guard: AuthGuard,
): void => {
  app.post(
    '/api/v1/employees',
    { preHandler: guard.requirePermission('employee.create') },
    async (request, reply) => {
      const parsed = createEmployeeBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      const employee = await service.create({
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName ?? null,
        telegramId: body.telegramId ? BigInt(body.telegramId) : null,
        phone: body.phone ?? null,
        role: body.role,
        branchId: body.branchId ?? null,
        departmentId: body.departmentId ?? null,
        isActive: body.isActive,
      });

      return reply.status(201).send(employee);
    },
  );

  app.get(
    '/api/v1/employees',
    { preHandler: guard.requirePermission('employee.list') },
    async (request) => {
      const parsed = employeeListQuerySchema.safeParse(request.query);

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
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        filters: {
          role: query.role,
          branchId: query.branchId,
          departmentId: query.departmentId,
          isActive: query.isActive,
        },
      });
    },
  );

  app.get(
    '/api/v1/employees/:id',
    { preHandler: guard.requirePermission('employee.read') },
    async (request) => {
      const parsed = employeeIdParamSchema.safeParse(request.params);

      if (!parsed.success) {
        throw AppError.badRequest('Invalid id');
      }

      return service.getById(parsed.data.id);
    },
  );

  app.patch(
    '/api/v1/employees/:id',
    { preHandler: guard.requirePermission('employee.update') },
    async (request) => {
      const params = employeeIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = updateEmployeeBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      return service.update(params.data.id, {
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        telegramId: body.telegramId ? BigInt(body.telegramId) : undefined,
        phone: body.phone,
        role: body.role,
        branchId: body.branchId,
        departmentId: body.departmentId,
        isActive: body.isActive,
      });
    },
  );

  app.delete(
    '/api/v1/employees/:id',
    { preHandler: guard.requirePermission('employee.delete') },
    async (request, reply) => {
      const params = employeeIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      await service.remove(params.data.id);

      return reply.status(204).send();
    },
  );
};