"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const pagination_1 = require("../../common/pagination/pagination");
const prisma_client_1 = require("../../database/prisma-client");
const customerInclude = {
    contacts: {
        where: { deletedAt: null },
        select: {
            id: true,
            name: true,
            phone: true,
            relation: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    },
    notes: {
        where: { deletedAt: null },
        select: {
            id: true,
            text: true,
            createdAt: true,
            author: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    },
    graveSites: {
        where: { deletedAt: null },
        select: { id: true, name: true, address: true },
    },
};
class CustomerRepository {
    async create(input) {
        const { contacts, ...fields } = input;
        return prisma_client_1.prisma.customer.create({
            data: {
                ...fields,
                contacts: contacts && contacts.length > 0
                    ? { create: [...contacts] }
                    : undefined,
            },
            include: customerInclude,
        });
    }
    async findById(id) {
        return prisma_client_1.prisma.customer.findFirst({
            where: { id, deletedAt: null },
            include: customerInclude,
        });
    }
    async update(id, input) {
        const exists = await this.findById(id);
        if (!exists) {
            return null;
        }
        return prisma_client_1.prisma.customer.update({
            where: { id },
            data: { ...input },
            include: customerInclude,
        });
    }
    async softDelete(id) {
        const exists = await this.findById(id);
        if (!exists) {
            return false;
        }
        await prisma_client_1.prisma.customer.update({
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
                : { createdAt: sortOrder };
        const [total, items] = await prisma_client_1.prisma.$transaction([
            prisma_client_1.prisma.customer.count({ where }),
            prisma_client_1.prisma.customer.findMany({
                where,
                orderBy,
                skip: page.skip,
                take: page.take,
                include: customerInclude,
            }),
        ]);
        return (0, pagination_1.buildPaginated)(items, total, page);
    }
    async addContact(customerId, input) {
        await prisma_client_1.prisma.customerContact.create({
            data: { customerId, ...input },
        });
    }
    async softDeleteContact(contactId) {
        const contact = await prisma_client_1.prisma.customerContact.findFirst({
            where: { id: contactId, deletedAt: null },
        });
        if (!contact) {
            return false;
        }
        await prisma_client_1.prisma.customerContact.update({
            where: { id: contactId },
            data: { deletedAt: new Date() },
        });
        return true;
    }
    async addNote(customerId, authorId, text) {
        await prisma_client_1.prisma.customerNote.create({
            data: { customerId, authorId, text },
        });
    }
}
exports.CustomerRepository = CustomerRepository;
//# sourceMappingURL=customer-repository.js.map