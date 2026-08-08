"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchService = void 0;
const app_error_1 = require("../../common/errors/app-error");
const toDto = (record) => ({
    id: record.id,
    name: record.name,
    address: record.address,
    phone: record.phone,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
});
class BranchService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        const record = await this.repository.create(input);
        return toDto(record);
    }
    async getById(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('Branch not found');
        }
        return toDto(record);
    }
    async update(id, input) {
        const record = await this.repository.update(id, input);
        if (!record) {
            throw app_error_1.AppError.notFound('Branch not found');
        }
        return toDto(record);
    }
    async remove(id) {
        const deleted = await this.repository.softDelete(id);
        if (!deleted) {
            throw app_error_1.AppError.notFound('Branch not found');
        }
    }
    async list(args) {
        const result = await this.repository.list(args);
        return { ...result, items: result.items.map(toDto) };
    }
}
exports.BranchService = BranchService;
//# sourceMappingURL=branch-service.js.map