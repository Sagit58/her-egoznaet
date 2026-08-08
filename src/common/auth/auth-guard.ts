import type { FastifyRequest } from 'fastify';

import { STAGE_TYPES } from '../../modules/orders/order.schemas';
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

type StageType = (typeof STAGE_TYPES)[number];

/**
 * Permission(s) required to update a production stage.
 *
 * A manager (or anyone with `order.change-status`) may update any stage.
 * Additionally, role-specific stage permissions let specialists advance
 * their own stage: `design.update` for DESIGNER, `production.update` for
 * PRODUCTION, `installation.update` for INSTALLER. SURVEY reuses
 * `order.change-status` since there is no dedicated `survey` resource.
 */
const STAGE_PERMISSIONS: Record<StageType, ReadonlyArray<Permission>> = {
  SURVEY: ['order.change-status'],
  DESIGN: ['order.change-status', 'design.update'],
  PRODUCTION: ['order.change-status', 'production.update'],
  INSTALLATION: ['order.change-status', 'installation.update'],
};

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

  /**
   * Permission pre-handler for the stage-update route.
   *
   * Resolves the stage `type` from the route params and grants access if
   * the caller holds any of the permissions mapped in `STAGE_PERMISSIONS`.
   * This lets managers (via `order.change-status`) move every stage while
   * specialists can advance only their own stage.
   */
  requireStagePermission() {
    const base = this.requireAuth();

    return async (request: FastifyRequest): Promise<void> => {
      await base(request);

      const context = request.authContext;

      if (!context) {
        throw AppError.unauthorized('Not authenticated');
      }

      const rawType = (request.params as { type?: string }).type;
      const allowed = rawType ? STAGE_PERMISSIONS[rawType as StageType] : undefined;

      if (!allowed || !allowed.some((p) => context.permissions.includes(p))) {
        throw AppError.forbidden('Insufficient permissions');
      }
    };
  }
}