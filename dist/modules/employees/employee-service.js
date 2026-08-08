"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = exports.toEmployeeDto = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/errors/app-error");
const toEmployeeDto = (record) => ({
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    middleName: record.middleName,
    telegramId: record.telegramId?.toString() ?? null,
    phone: record.phone,
    role: record.role,
    branchId: record.branchId,
    departmentId: record.departmentId,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
});
exports.toEmployeeDto = toEmployeeDto;
class EmployeeService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        try {
            const record = await this.repository.create(input);
            return (0, exports.toEmployeeDto)(record);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw app_error_1.AppError.conflict('Employee with this Telegram ID already exists');
            }
            throw error;
        }
    }
    async update(id, input) {
        const record = await this.repository.update(id, input);
        if (!record) {
            throw app_error_1.AppError.notFound('Employee not found');
        }
        return (0, exports.toEmployeeDto)(record);
    }
    async remove(id) {
        const deleted = await this.repository.softDelete(id);
        if (!deleted) {
            throw app_error_1.AppError.notFound('Employee not found');
        }
    }
    async getById(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('Employee not found');
        }
        return (0, exports.toEmployeeDto)(record);
    }
    async list(args) {
        const result = await this.repository.list(args);
        return {
            ...result,
            items: result.items.map(exports.toEmployeeDto),
        };
    }
}
exports.EmployeeService = EmployeeService;
//# sourceMappingURL=employee-service.js.map