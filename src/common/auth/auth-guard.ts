import type { FastifyRequest } from 'fastify';

import type { EmployeeAuthRepository } from '../../modules/auth/employee-auth-repository';
import type { JwtService } from '../../modules/auth/jwt-service';
import { AppError } from '../errors/app-error';
import type { Permission } from '../rbac/rbac.types';
import { ROLE_PERMISSIONS } from '../rbac/role-permissions';
import type { AuthContext } from './auth-context.types';

declare module 'fastify' {
  interface FastifyRequest {
    authContext?: AuthContext;
  }
}

export class AuthGuard {
  constructor(
    private readonly jwtService: JwtService,
    private readonly employeeAuthRepository: EmployeeAuthRepository,
  ) {}

  requireAuth() {
    return async (request: FastifyRequest): Promise<void> => {
      const header = request.headers.authorization;

      if (!header || !header.startsWith('Bearer ')) {
        throw AppError.unauthorized('Missing bearer token');
      }

      const token = header.slice('Bearer '.length);

      const payload = this.jwtService.verifyAccessToken(token);

      const employee =
        await this.employeeAuthRepository.findActiveById(payload.employeeId);

      if (!employee) {
        throw AppError.unauthorized('Employee is not active');
      }

      request.authContext = {
        employeeId: employee.id,
        telegramId: employee.telegramId?.toString() ?? '',
        role: employee.role,
        permissions: ROLE_PERMISSIONS[employee.role],
        branchId: employee.branchId,
        departmentId: employee.departmentId,
      };
    };
  }

  requirePermission(permission: Permission) {
    const base = this.requireAuth();

    return async (request: FastifyRequest): Promise<void> => {
      await base(request);

      const context = request.authContext;

      if (!context || !context.permissions.includes(permission)) {
        throw AppError.forbidden('Insufficient permissions');
      }
    };
  }
}