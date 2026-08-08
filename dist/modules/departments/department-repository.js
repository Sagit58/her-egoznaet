"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentRepository = void 0;
const pagination_1 = require("../../common/pagination/pagination");
const prisma_client_1 = require("../../database/prisma-client");
const departmentInclude = {
    branch: {
        select: { id: true, name: true },
    },
};
class DepartmentRepository {
    async create(input) {
        if (!input.branchId) {
            throw new Error('branchId is required to create a department');
        }
        return prisma_client_1.prisma.department.create({
            data: {
                name: input.name,
                branch: { connect: { id: input.branchId } },
            },
            include: departmentInclude,
        });
    }
    async findById(id) {
        return prisma_client_1.prisma.department.findFirst({
            where: { id, deletedAt: null },
            include: departmentInclude,
        });
    }
    async update(id, input) {
        const exists = await this.findById(id);
        if (!exists) {
            return null;
        }
        const data = {};
        if (input.name !== undefined) {
            data.name = input.name;
        }
        if (input.branchId) {
            data.branch = { connect: { id: input.branchId } };
        }
        return prisma_client_1.prisma.department.update({
            where: { id },
            data,
            include: departmentInclude,
        });
    }
    async softDelete(id) {
        const exists = await this.findById(id);
        if (!exists) {
            return false;
        }
        await prisma_client_1.prisma.department.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return true;
    }
    async list(args) {
        const page = (0, pagination_1.normalizePage)(args.page, args.pageSize);
        const where = {
            deletedAt: null,
            branchId: args.branchId,
            ...(args.search
                ? { name: { contains: args.search, mode: 'insensitive' } }
                : {}),
        };
        const [total, items] = await prisma_client_1.prisma.$transaction([
            prisma_client_1.prisma.department.count({ where }),
            prisma_client_1.prisma.department.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: page.skip,
                take: page.take,
                include: departmentInclude,
            }),
        ]);
        return (0, pagination_1.buildPaginated)(items, total, page);
    }
}
exports.DepartmentRepository = DepartmentRepository;
//# sourceMappingURL=department-repository.js.map