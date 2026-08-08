"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraveSiteService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/errors/app-error");
const toBurialDto = (burial) => ({
    id: burial.id,
    graveSiteId: burial.graveSiteId,
    fullName: burial.fullName,
    birthDate: burial.birthDate?.toISOString() ?? null,
    deathDate: burial.deathDate?.toISOString() ?? null,
    comment: burial.comment,
    createdAt: burial.createdAt.toISOString(),
    updatedAt: burial.updatedAt.toISOString(),
});
const toDto = (record) => ({
    id: record.id,
    name: record.name,
    address: record.address,
    latitude: record.latitude,
    longitude: record.longitude,
    size: record.size,
    features: record.features,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    customer: record.customer,
    burials: record.burials.map(toBurialDto),
});
class GraveSiteService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        try {
            const record = await this.repository.create(input);
            return toDto(record);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw app_error_1.AppError.notFound('Customer not found');
            }
            throw error;
        }
    }
    async getById(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('Grave site not found');
        }
        return toDto(record);
    }
    async update(id, input) {
        const record = await this.repository.update(id, input);
        if (!record) {
            throw app_error_1.AppError.notFound('Grave site not found');
        }
        return toDto(record);
    }
    async remove(id) {
        const deleted = await this.repository.softDelete(id);
        if (!deleted) {
            throw app_error_1.AppError.notFound('Grave site not found');
        }
    }
    async list(args) {
        const result = await this.repository.list(args);
        return { ...result, items: result.items.map(toDto) };
    }
    async addBurial(graveSiteId, input) {
        const exists = await this.repository.findById(graveSiteId);
        if (!exists) {
            throw app_error_1.AppError.notFound('Grave site not found');
        }
        const record = await this.repository.addBurial(graveSiteId, input);
        return toDto(record);
    }
    async updateBurial(burialId, input) {
        const updated = await this.repository.updateBurial(burialId, input);
        if (!updated) {
            throw app_error_1.AppError.notFound('Burial not found');
        }
    }
    async removeBurial(burialId) {
        const deleted = await this.repository.softDeleteBurial(burialId);
        if (!deleted) {
            throw app_error_1.AppError.notFound('Burial not found');
        }
    }
}
exports.GraveSiteService = GraveSiteService;
//# sourceMappingURL=grave-site-service.js.map