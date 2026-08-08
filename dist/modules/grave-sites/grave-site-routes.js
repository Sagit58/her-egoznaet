"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGraveSiteRoutes = void 0;
const app_error_1 = require("../../common/errors/app-error");
const grave_site_schemas_1 = require("./grave-site.schemas");
const registerGraveSiteRoutes = (app, service, guard) => {
    app.post('/api/v1/grave-sites', { preHandler: guard.requirePermission('grave-site.create') }, async (request, reply) => {
        const parsed = grave_site_schemas_1.createGraveSiteBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const body = parsed.data;
        const graveSite = await service.create({
            customerId: body.customerId,
            name: body.name,
            address: body.address ?? null,
            size: body.size ?? null,
            features: body.features ?? null,
        });
        return reply.status(201).send(graveSite);
    });
    app.get('/api/v1/grave-sites', { preHandler: guard.requirePermission('grave-site.list') }, async (request) => {
        const parsed = grave_site_schemas_1.graveSiteListQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid query parameters', parsed.error.flatten().fieldErrors);
        }
        const query = parsed.data;
        return service.list({
            page: query.page,
            pageSize: query.pageSize,
            search: query.search,
            customerId: query.customerId,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
    });
    app.get('/api/v1/grave-sites/:id', { preHandler: guard.requirePermission('grave-site.read') }, async (request) => {
        const parsed = grave_site_schemas_1.graveSiteIdParamSchema.safeParse(request.params);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        return service.getById(parsed.data.id);
    });
    app.patch('/api/v1/grave-sites/:id', { preHandler: guard.requirePermission('grave-site.update') }, async (request) => {
        const params = grave_site_schemas_1.graveSiteIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = grave_site_schemas_1.updateGraveSiteBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        return service.update(params.data.id, parsed.data);
    });
    app.delete('/api/v1/grave-sites/:id', { preHandler: guard.requirePermission('grave-site.delete') }, async (request, reply) => {
        const params = grave_site_schemas_1.graveSiteIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        await service.remove(params.data.id);
        return reply.status(204).send();
    });
    app.post('/api/v1/grave-sites/:id/burials', { preHandler: guard.requirePermission('burial.create') }, async (request, reply) => {
        const params = grave_site_schemas_1.graveSiteIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = grave_site_schemas_1.burialBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const body = parsed.data;
        const graveSite = await service.addBurial(params.data.id, {
            fullName: body.fullName,
            birthDate: body.birthDate ? new Date(body.birthDate) : null,
            deathDate: body.deathDate ? new Date(body.deathDate) : null,
            comment: body.comment ?? null,
        });
        return reply.status(201).send(graveSite);
    });
    app.patch('/api/v1/grave-sites/:id/burials/:burialId', { preHandler: guard.requirePermission('burial.update') }, async (request, reply) => {
        const params = grave_site_schemas_1.burialIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = grave_site_schemas_1.burialBodySchema.partial().safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const body = parsed.data;
        await service.updateBurial(params.data.burialId, {
            fullName: body.fullName,
            birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
            deathDate: body.deathDate ? new Date(body.deathDate) : undefined,
            comment: body.comment,
        });
        return reply.status(204).send();
    });
    app.delete('/api/v1/grave-sites/:id/burials/:burialId', { preHandler: guard.requirePermission('burial.delete') }, async (request, reply) => {
        const params = grave_site_schemas_1.burialIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        await service.removeBurial(params.data.burialId);
        return reply.status(204).send();
    });
};
exports.registerGraveSiteRoutes = registerGraveSiteRoutes;
//# sourceMappingURL=grave-site-routes.js.map