"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileRoutes = void 0;
const app_error_1 = require("../../common/errors/app-error");
const file_schemas_1 = require("./file.schemas");
/**
 * Extract a scalar string value from a multipart field, which may be a single
 * {@link Multipart} value or an array of values.
 */
const scalar = (field) => {
    if (!field) {
        return undefined;
    }
    if (Array.isArray(field)) {
        const [first] = field;
        return first && 'value' in first ? first.value : undefined;
    }
    return 'value' in field ? field.value : undefined;
};
const registerFileRoutes = (app, service, guard) => {
    app.post('/api/v1/files', { preHandler: guard.requirePermission('file.upload') }, async (request, reply) => {
        const data = await request.file();
        if (!data) {
            throw app_error_1.AppError.badRequest('File is missing');
        }
        const fields = file_schemas_1.fileFieldsSchema.safeParse({
            category: scalar(data.fields['category']),
            orderId: scalar(data.fields['orderId']),
            customerId: scalar(data.fields['customerId']),
        });
        if (!fields.success) {
            throw app_error_1.AppError.badRequest('Invalid fields', fields.error.flatten().fieldErrors);
        }
        const context = request.authContext;
        if (!context) {
            throw app_error_1.AppError.unauthorized('Not authenticated');
        }
        const buffer = await data.toBuffer();
        const file = await service.upload({
            buffer,
            fileName: data.filename ?? 'file',
            mimeType: data.mimetype,
            category: fields.data.category,
            ownerId: context.employeeId,
            orderId: fields.data.orderId,
            customerId: fields.data.customerId,
        });
        return reply.status(201).send(file);
    });
    app.get('/api/v1/files', { preHandler: guard.requirePermission('file.list') }, async (request) => {
        const parsed = file_schemas_1.fileListQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid query parameters', parsed.error.flatten().fieldErrors);
        }
        const query = parsed.data;
        return service.list({
            page: query.page,
            pageSize: query.pageSize,
            orderId: query.orderId,
            customerId: query.customerId,
            category: query.category,
        });
    });
    app.get('/api/v1/files/:id/download', { preHandler: guard.requirePermission('file.download') }, async (request) => {
        const params = file_schemas_1.fileIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        return service.getDownloadUrl(params.data.id);
    });
    app.delete('/api/v1/files/:id', { preHandler: guard.requirePermission('file.delete') }, async (request, reply) => {
        const params = file_schemas_1.fileIdParamSchema.safeParse(request.params);
        if (!params.success) {
            throw app_error_1.AppError.badRequest('Invalid id');
        }
        await service.remove(params.data.id);
        return reply.status(204).send();
    });
};
exports.registerFileRoutes = registerFileRoutes;
//# sourceMappingURL=file-routes.js.map