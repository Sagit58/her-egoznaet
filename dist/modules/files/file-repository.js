"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRepository = void 0;
const pagination_1 = require("../../common/pagination/pagination");
const prisma_client_1 = require("../../database/prisma-client");
const fileSelect = {
    id: true,
    ownerId: true,
    orderId: true,
    customerId: true,
    category: true,
    originalName: true,
    mimeType: true,
    sizeBytes: true,
    storageKey: true,
    createdAt: true,
    deletedAt: true,
    owner: {
        select: { id: true, firstName: true, lastName: true },
    },
};
class FileRepository {
    async create(input) {
        return prisma_client_1.prisma.fileEntity.create({
            data: { ...input },
            select: fileSelect,
        });
    }
    async findById(id) {
        return prisma_client_1.prisma.fileEntity.findFirst({
            where: { id, deletedAt: null },
            select: fileSelect,
        });
    }
    async softDelete(id) {
        const exists = await this.findById(id);
        if (!exists) {
            return false;
        }
        await prisma_client_1.prisma.fileEntity.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return true;
    }
    async list(args) {
        const page = (0, pagination_1.normalizePage)(args.page, args.pageSize);
        const where = {
            deletedAt: null,
            orderId: args.orderId,
            customerId: args.customerId,
            category: args.category,
        };
        const [total, items] = await prisma_client_1.prisma.$transaction([
            prisma_client_1.prisma.fileEntity.count({ where }),
            prisma_client_1.prisma.fileEntity.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: page.skip,
                take: page.take,
                select: fileSelect,
            }),
        ]);
        return (0, pagination_1.buildPaginated)(items, total, page);
    }
}
exports.FileRepository = FileRepository;
//# sourceMappingURL=file-repository.js.map