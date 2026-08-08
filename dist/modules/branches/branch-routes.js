"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBranchRoutes = void 0;
const app_error_1 = require("../../common/errors/app-error");
const branch_schemas_1 = require("./branch.schemas");
const registerBranchRoutes = (app, service, guard) => {
    app.post('/api/v1/branches', { preHandler: guard.requirePermission('branch.create') }, async (request, reply) => {
        const parsed = branch_schemas_1.createBranchBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const body = parsed.data;
        const branch = await service.create({
            name: body.name,
            address: body.address ?? null,
            phone: body.phone ?? null,
        });
        return reply.status(201).send(branch);
    });
    app.get('/api/v1/branches', { preHandler: guard.requirePermission('branch.list') }, async (request) => {
        const parsed = branch_schemas_1.branchListQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid query parameters', parsed.error.flatten().fieldErrors);
        }
        const query = parsed.data;
        return service.list({
            page: query.page,
            pageSize: query.pageSize,
            search: query.search,
        });
    });
    app.get('/api/v1/branches/:id', { preHandler: guard.requirePermission('branch.read') }, async (request) => {
        const parsed = branch_schemas_1.branchIdParamSchema.safeParse(request.params);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        return service.getById(parsed.data.id);
    });
    app.patch('/api/v1/branches/:id', { preHandler: guard.requirePermission('branch.update') }, async (request) => {
        const params = branch_schemas_1.branchIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = branch_schemas_1.updateBranchBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        return service.update(params.data.id, parsed.data);
    });
    app.delete('/api/v1/branches/:id', { preHandler: guard.requirePermission('branch.delete') }, async (request, reply) => {
        const params = branch_schemas_1.branchIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        await service.remove(params.data.id);
        return reply.status(204).send();
    });
};
exports.registerBranchRoutes = registerBranchRoutes;
//# sourceMappingURL=branch-routes.js.map