"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeRepository = void 0;
const pagination_1 = require("../../common/pagination/pagination");
const prisma_client_1 = require("../../database/prisma-client");
const employeeSelect = {
    id: true,
    firstName: true,
    lastName: true,
    middleName: true,
    telegramId: true,
    phone: true,
    role: true,
    branchId: true,
    departmentId: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
};
class EmployeeRepository {
    async create(input) {
        return prisma_client_1.prisma.employee.create({
            data: { ...input },
            select: employeeSelect,
        });
    }
    async update(id, input) {
        const exists = await this.findById(id);
        if (!exists) {
            return null;
        }
        return prisma_client_1.prisma.employee.update({
            where: { id },
            data: { ...input },
            select: employeeSelect,
        });
    }
    async softDelete(id) {
        const exists = await this.findById(id);
        if (!exists) {
            return false;
        }
        await prisma_client_1.prisma.employee.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return true;
    }
    async findById(id) {
        return prisma_client_1.prisma.employee.findFirst({
            where: { id, deletedAt: null },
            select: employeeSelect,
        });
    }
    async list(args) {
        const page = (0, pagination_1.normalizePage)(args.page, args.pageSize);
        const where = {
            deletedAt: null,
            role: args.filters?.role,
            branchId: args.filters?.branchId,
            departmentId: args.filters?.departmentId,
            isActive: args.filters?.isActive,
            ...(args.search
                ? {
                    OR: [
                        { firstName: { contains: args.search, mode: 'insensitive' } },
                        { lastName: { contains: args.search, mode: 'insensitive' } },
                        { phone: { contains: args.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const sortBy = args.sortBy ?? 'createdAt';
        const sortOrder = args.sortOrder ?? 'desc';
        const orderBy = sortBy === 'firstName'
            ? { firstName: sortOrder }
            : sortBy === 'lastName'
                ? { lastName: sortOrder }
                : sortBy === 'role'
                    ? { role: sortOrder }
                    : { createdAt: sortOrder };
        const [total, items] = await prisma_client_1.prisma.$transaction([
            prisma_client_1.prisma.employee.count({ where }),
            prisma_client_1.prisma.employee.findMany({
                where,
                orderBy,
                skip: page.skip,
                take: page.take,
                select: employeeSelect,
            }),
        ]);
        return (0, pagination_1.buildPaginated)(items, total, page);
    }
}
exports.EmployeeRepository = EmployeeRepository;
//# sourceMappingURL=employee-repository.js.map