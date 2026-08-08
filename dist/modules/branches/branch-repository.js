"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchRepository = void 0;
const pagination_1 = require("../../common/pagination/pagination");
const prisma_client_1 = require("../../database/prisma-client");
const branchSelect = {
    id: true,
    name: true,
    address: true,
    phone: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
};
class BranchRepository {
    async create(input) {
        return prisma_client_1.prisma.branch.create({
            data: { ...input },
            select: branchSelect,
        });
    }
    async findById(id) {
        return prisma_client_1.prisma.branch.findFirst({
            where: { id, deletedAt: null },
            select: branchSelect,
        });
    }
    async update(id, input) {
        const exists = await this.findById(id);
        if (!exists) {
            return null;
        }
        return prisma_client_1.prisma.branch.update({
            where: { id },
            data: { ...input },
            select: branchSelect,
        });
    }
    async softDelete(id) {
        const exists = await this.findById(id);
        if (!exists) {
            return false;
        }
        await prisma_client_1.prisma.branch.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return true;
    }
    async list(args) {
        const page = (0, pagination_1.normalizePage)(args.page, args.pageSize);
        const where = {
            deletedAt: null,
            ...(args.search
                ? { name: { contains: args.search, mode: 'insensitive' } }
                : {}),
        };
        const [total, items] = await prisma_client_1.prisma.$transaction([
            prisma_client_1.prisma.branch.count({ where }),
            prisma_client_1.prisma.branch.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: page.skip,
                take: page.take,
                select: branchSelect,
            }),
        ]);
        return (0, pagination_1.buildPaginated)(items, total, page);
    }
}
exports.BranchRepository = BranchRepository;
//# sourceMappingURL=branch-repository.js.map