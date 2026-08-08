"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDepartmentRoutes = void 0;
const app_error_1 = require("../../common/errors/app-error");
const department_schemas_1 = require("./department.schemas");
const registerDepartmentRoutes = (app, service, guard) => {
    app.post('/api/v1/departments', { preHandler: guard.requirePermission('department.create') }, async (request, reply) => {
        const parsed = department_schemas_1.createDepartmentBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const body = parsed.data;
        const department = await service.create({
            name: body.name,
            branchId: body.branchId ?? null,
        });
        return reply.status(201).send(department);
    });
    app.get('/api/v1/departments', { preHandler: guard.requirePermission('department.list') }, async (request) => {
        const parsed = department_schemas_1.departmentListQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid query parameters', parsed.error.flatten().fieldErrors);
        }
        const query = parsed.data;
        return service.list({
            page: query.page,
            pageSize: query.pageSize,
            search: query.search,
            branchId: query.branchId,
        });
    });
    app.get('/api/v1/departments/:id', { preHandler: guard.requirePermission('department.read') }, async (request) => {
        const parsed = department_schemas_1.departmentIdParamSchema.safeParse(request.params);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        return service.getById(parsed.data.id);
    });
    app.patch('/api/v1/departments/:id', { preHandler: guard.requirePermission('department.update') }, async (request) => {
        const params = department_schemas_1.departmentIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = department_schemas_1.updateDepartmentBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        return service.update(params.data.id, parsed.data);
    });
    app.delete('/api/v1/departments/:id', { preHandler: guard.requirePermission('department.delete') }, async (request, reply) => {
        const params = department_schemas_1.departmentIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        await service.remove(params.data.id);
        return reply.status(204).send();
    });
};
exports.registerDepartmentRoutes = registerDepartmentRoutes;
//# sourceMappingURL=department-routes.js.map