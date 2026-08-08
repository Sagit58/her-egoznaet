"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/errors/app-error");
const toDto = (record) => ({
    id: record.id,
    name: record.name,
    branch: record.branch,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
});
class DepartmentService {
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
                throw app_error_1.AppError.notFound('Branch not found');
            }
            throw error;
        }
    }
    async getById(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('Department not found');
        }
        return toDto(record);
    }
    async update(id, input) {
        const record = await this.repository.update(id, input);
        if (!record) {
            throw app_error_1.AppError.notFound('Department not found');
        }
        return toDto(record);
    }
    async remove(id) {
        const deleted = await this.repository.softDelete(id);
        if (!deleted) {
            throw app_error_1.AppError.notFound('Department not found');
        }
    }
    async list(args) {
        const result = await this.repository.list(args);
        return { ...result, items: result.items.map(toDto) };
    }
}
exports.DepartmentService = DepartmentService;
//# sourceMappingURL=department-service.js.map