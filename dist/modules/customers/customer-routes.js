"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCustomerRoutes = void 0;
const app_error_1 = require("../../common/errors/app-error");
const customer_schemas_1 = require("./customer.schemas");
const zod_1 = require("zod");
const customerContactParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    contactId: zod_1.z.string().uuid(),
});
const registerCustomerRoutes = (app, service, guard) => {
    app.post('/api/v1/customers', { preHandler: guard.requirePermission('customer.create') }, async (request, reply) => {
        const parsed = customer_schemas_1.createCustomerBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const body = parsed.data;
        const customer = await service.create({
            firstName: body.firstName,
            lastName: body.lastName,
            middleName: body.middleName ?? null,
            phone: body.phone,
            email: body.email ?? null,
            comment: body.comment ?? null,
            contacts: body.contacts,
        });
        return reply.status(201).send(customer);
    });
    app.get('/api/v1/customers', { preHandler: guard.requirePermission('customer.list') }, async (request) => {
        const parsed = customer_schemas_1.customerListQuerySchema.safeParse(request.query);
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
        });
    });
    app.get('/api/v1/customers/:id', { preHandler: guard.requirePermission('customer.read') }, async (request) => {
        const parsed = customer_schemas_1.customerIdParamSchema.safeParse(request.params);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        return service.getById(parsed.data.id);
    });
    app.patch('/api/v1/customers/:id', { preHandler: guard.requirePermission('customer.update') }, async (request) => {
        const params = customer_schemas_1.customerIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = customer_schemas_1.updateCustomerBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        return service.update(params.data.id, parsed.data);
    });
    app.delete('/api/v1/customers/:id', { preHandler: guard.requirePermission('customer.delete') }, async (request, reply) => {
        const params = customer_schemas_1.customerIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        await service.remove(params.data.id);
        return reply.status(204).send();
    });
    app.post('/api/v1/customers/:id/contacts', { preHandler: guard.requirePermission('customer.update') }, async (request, reply) => {
        const params = customer_schemas_1.customerIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = customer_schemas_1.contactBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const customer = await service.addContact(params.data.id, parsed.data);
        return reply.status(201).send(customer);
    });
    app.delete('/api/v1/customers/:id/contacts/:contactId', { preHandler: guard.requirePermission('customer.update') }, async (request, reply) => {
        const params = customerContactParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        await service.removeContact(params.data.contactId);
        return reply.status(204).send();
    });
    app.post('/api/v1/customers/:id/notes', { preHandler: guard.requirePermission('customer.update') }, async (request, reply) => {
        const params = customer_schemas_1.customerIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        const parsed = customer_schemas_1.noteBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const context = request.authContext;
        if (!context) {
            throw app_error_1.AppError.unauthorized('Not authenticated');
        }
        const customer = await service.addNote(params.data.id, context.employeeId, parsed.data.text);
        return reply.status(201).send(customer);
    });
};
exports.registerCustomerRoutes = registerCustomerRoutes;
//# sourceMappingURL=customer-routes.js.map