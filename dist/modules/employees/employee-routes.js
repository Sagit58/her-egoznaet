"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEmployeeRoutes = void 0;
const app_error_1 = require("../../common/errors/app-error");
const employee_schemas_1 = require("./employee.schemas");
const registerEmployeeRoutes = (app, service, guard) => {
    app.post('/api/v1/employees', { preHandler: guard.requirePermission('employee.create') }, async (request, reply) => {
        const parsed = employee_schemas_1.createEmployeeBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
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
    });
    app.get('/api/v1/employees', { preHandler: guard.requirePermission('employee.list') }, async (request) => {
        const parsed = employee_schemas_1.employeeListQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid query parameters', parsed.error.flatten().fieldErrors);
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
    });
    app.get('/api/v1/employees/:id', { preHandler: guard.requirePermission('employee.read') }, async (request) => {
        const parsed = employee_schemas_1.employeeIdParamSchema.safeParse(request.params);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        return service.getById(parsed.data.id);
    });
    app.patch('/api/v1/employees/:id', { preHandler: guard.requirePermission('employee.update') }, async (request) => {
        const params = employee_schemas_1.employeeIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = employee_schemas_1.updateEmployeeBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
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
    });
    app.delete('/api/v1/employees/:id', { preHandler: guard.requirePermission('employee.delete') }, async (request, reply) => {
        const params = employee_schemas_1.employeeIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        await service.remove(params.data.id);
        return reply.status(204).send();
    });
};
exports.registerEmployeeRoutes = registerEmployeeRoutes;
//# sourceMappingURL=employee-routes.js.map