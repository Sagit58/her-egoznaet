"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const app_error_1 = require("../errors/app-error");
const role_permissions_1 = require("../rbac/role-permissions");
/**
 * Permission(s) required to update a production stage.
 *
 * A manager (or anyone with `order.change-status`) may update any stage.
 * Additionally, role-specific stage permissions let specialists advance
 * their own stage: `design.update` for DESIGNER, `production.update` for
 * PRODUCTION, `installation.update` for INSTALLER. SURVEY reuses
 * `order.change-status` since there is no dedicated `survey` resource.
 */
const STAGE_PERMISSIONS = {
    SURVEY: ['order.change-status'],
    DESIGN: ['order.change-status', 'design.update'],
    PRODUCTION: ['order.change-status', 'production.update'],
    INSTALLATION: ['order.change-status', 'installation.update'],
};
class AuthGuard {
    jwtService;
    employeeAuthRepository;
    constructor(jwtService, employeeAuthRepository) {
        this.jwtService = jwtService;
        this.employeeAuthRepository = employeeAuthRepository;
    }
    requireAuth() {
        return async (request) => {
            const header = request.headers.authorization;
            if (!header || !header.startsWith('Bearer ')) {
                throw app_error_1.AppError.unauthorized('Missing bearer token');
            }
            const token = header.slice('Bearer '.length);
            const payload = this.jwtService.verifyAccessToken(token);
            const employee = await this.employeeAuthRepository.findActiveById(payload.employeeId);
            if (!employee) {
                throw app_error_1.AppError.unauthorized('Employee is not active');
            }
            request.authContext = {
                employeeId: employee.id,
                telegramId: employee.telegramId?.toString() ?? '',
                role: employee.role,
                permissions: role_permissions_1.ROLE_PERMISSIONS[employee.role],
                branchId: employee.branchId,
                departmentId: employee.departmentId,
            };
        };
    }
    requirePermission(permission) {
        const base = this.requireAuth();
        return async (request) => {
            await base(request);
            const context = request.authContext;
            if (!context || !context.permissions.includes(permission)) {
                throw app_error_1.AppError.forbidden('Insufficient permissions');
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
        return async (request) => {
            await base(request);
            const context = request.authContext;
            if (!context) {
                throw app_error_1.AppError.unauthorized('Not authenticated');
            }
            const rawType = request.params.type;
            const allowed = rawType ? STAGE_PERMISSIONS[rawType] : undefined;
            if (!allowed || !allowed.some((p) => context.permissions.includes(p))) {
                throw app_error_1.AppError.forbidden('Insufficient permissions');
            }
        };
    }
}
exports.AuthGuard = AuthGuard;
//# sourceMappingURL=auth-guard.js.map