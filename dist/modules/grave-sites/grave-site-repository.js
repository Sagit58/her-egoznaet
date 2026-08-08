"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraveSiteRepository = void 0;
const pagination_1 = require("../../common/pagination/pagination");
const prisma_client_1 = require("../../database/prisma-client");
const graveSiteInclude = {
    customer: {
        select: { id: true, firstName: true, lastName: true, phone: true },
    },
    burials: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
    },
};
class GraveSiteRepository {
    async create(input) {
        return prisma_client_1.prisma.graveSite.create({
            data: { ...input },
            include: graveSiteInclude,
        });
    }
    async findById(id) {
        return prisma_client_1.prisma.graveSite.findFirst({
            where: { id, deletedAt: null },
            include: graveSiteInclude,
        });
    }
    async update(id, input) {
        const exists = await this.findById(id);
        if (!exists) {
            return null;
        }
        return prisma_client_1.prisma.graveSite.update({
            where: { id },
            data: { ...input },
            include: graveSiteInclude,
        });
    }
    async softDelete(id) {
        const exists = await this.findById(id);
        if (!exists) {
            return false;
        }
        await prisma_client_1.prisma.graveSite.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return true;
    }
    async list(args) {
        const page = (0, pagination_1.normalizePage)(args.page, args.pageSize);
        const where = {
            deletedAt: null,
            customerId: args.customerId,
            ...(args.search
                ? {
                    OR: [
                        { name: { contains: args.search, mode: 'insensitive' } },
                        { address: { contains: args.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const sortBy = args.sortBy ?? 'createdAt';
        const sortOrder = args.sortOrder ?? 'desc';
        const orderBy = sortBy === 'name' ? { name: sortOrder } : { createdAt: sortOrder };
        const [total, items] = await prisma_client_1.prisma.$transaction([
            prisma_client_1.prisma.graveSite.count({ where }),
            prisma_client_1.prisma.graveSite.findMany({
                where,
                orderBy,
                skip: page.skip,
                take: page.take,
                include: graveSiteInclude,
            }),
        ]);
        return (0, pagination_1.buildPaginated)(items, total, page);
    }
    async addBurial(graveSiteId, input) {
        await prisma_client_1.prisma.burial.create({
            data: { graveSiteId, ...input },
        });
        const record = await this.findById(graveSiteId);
        if (!record) {
            throw new Error('Grave site not found after burial create');
        }
        return record;
    }
    async updateBurial(burialId, input) {
        const burial = await prisma_client_1.prisma.burial.findFirst({
            where: { id: burialId, deletedAt: null },
        });
        if (!burial) {
            return false;
        }
        await prisma_client_1.prisma.burial.update({
            where: { id: burialId },
            data: { ...input },
        });
        return true;
    }
    async softDeleteBurial(burialId) {
        const burial = await prisma_client_1.prisma.burial.findFirst({
            where: { id: burialId, deletedAt: null },
        });
        if (!burial) {
            return false;
        }
        await prisma_client_1.prisma.burial.update({
            where: { id: burialId },
            data: { deletedAt: new Date() },
        });
        return true;
    }
}
exports.GraveSiteRepository = GraveSiteRepository;
//# sourceMappingURL=grave-site-repository.js.map