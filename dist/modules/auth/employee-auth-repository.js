"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeAuthRepository = void 0;
const prisma_client_1 = require("../../database/prisma-client");
const employeeSelect = {
    id: true,
    firstName: true,
    lastName: true,
    telegramId: true,
    role: true,
    branchId: true,
    departmentId: true,
};
class EmployeeAuthRepository {
    async findActiveByTelegramId(telegramId) {
        return prisma_client_1.prisma.employee.findFirst({
            where: { telegramId, isActive: true, deletedAt: null },
            select: employeeSelect,
        });
    }
    async findActiveById(id) {
        return prisma_client_1.prisma.employee.findFirst({
            where: { id, isActive: true, deletedAt: null },
            select: employeeSelect,
        });
    }
    async upsertSuperAdmin(id) {
        return prisma_client_1.prisma.employee.upsert({
            where: { id },
            update: {
                firstName: 'Super',
                lastName: 'Admin',
                role: 'ADMINISTRATOR',
                isActive: true,
                deletedAt: null,
            },
            create: {
                id,
                firstName: 'Super',
                lastName: 'Admin',
                role: 'ADMINISTRATOR',
                isActive: true,
            },
            select: employeeSelect,
        });
    }
}
exports.EmployeeAuthRepository = EmployeeAuthRepository;
//# sourceMappingURL=employee-auth-repository.js.map