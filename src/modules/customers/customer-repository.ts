import type { Prisma } from '@prisma/client';

import {
  buildPaginated,
  normalizePage,
} from '../../common/pagination/pagination';
import type { Paginated } from '../../common/pagination/pagination.types';
import { prisma } from '../../database/prisma-client';

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
} as const;

export type CustomerRecord = Prisma.CustomerGetPayload<{
  include: typeof customerInclude;
}>;

export interface CustomerContactInput {
  readonly name: string;
  readonly phone: string;
  readonly relation?: string | null;
}

export interface CustomerWriteInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName?: string | null;
  readonly phone: string;
  readonly email?: string | null;
  readonly comment?: string | null;
  readonly contacts?: ReadonlyArray<CustomerContactInput>;
}

export type CustomerUpdateInput = Partial<Omit<CustomerWriteInput, 'contacts'>>;

export interface CustomerListArgs {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly sortBy?: 'createdAt' | 'firstName' | 'lastName';
  readonly sortOrder?: 'asc' | 'desc';
}

export class CustomerRepository {
  async create(input: CustomerWriteInput): Promise<CustomerRecord> {
    const { contacts, ...fields } = input;

    return prisma.customer.create({
      data: {
        ...fields,
        contacts:
          contacts && contacts.length > 0
            ? { create: [...contacts] }
            : undefined,
      },
      include: customerInclude,
    });
  }

  async findById(id: string): Promise<CustomerRecord | null> {
    return prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: customerInclude,
    });
  }

  async update(
    id: string,
    input: CustomerUpdateInput,
  ): Promise<CustomerRecord | null> {
    const exists = await this.findById(id);

    if (!exists) {
      return null;
    }

    return prisma.customer.update({
      where: { id },
      data: { ...input },
      include: customerInclude,
    });
  }

  async softDelete(id: string): Promise<boolean> {
    const exists = await this.findById(id);

    if (!exists) {
      return false;
    }

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  async list(args: CustomerListArgs): Promise<Paginated<CustomerRecord>> {
    const page = normalizePage(args.page, args.pageSize);

    const where: Prisma.CustomerWhereInput = {
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

    const orderBy: Prisma.CustomerOrderByWithRelationInput =
      sortBy === 'firstName'
        ? { firstName: sortOrder }
        : sortBy === 'lastName'
          ? { lastName: sortOrder }
          : { createdAt: sortOrder };

    const [total, items] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy,
        skip: page.skip,
        take: page.take,
        include: customerInclude,
      }),
    ]);

    return buildPaginated(items, total, page);
  }

  async addContact(
    customerId: string,
    input: CustomerContactInput,
  ): Promise<void> {
    await prisma.customerContact.create({
      data: { customerId, ...input },
    });
  }

  async softDeleteContact(contactId: string): Promise<boolean> {
    const contact = await prisma.customerContact.findFirst({
      where: { id: contactId, deletedAt: null },
    });

    if (!contact) {
      return false;
    }

    await prisma.customerContact.update({
      where: { id: contactId },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  async addNote(
    customerId: string,
    authorId: string,
    text: string,
  ): Promise<void> {
    await prisma.customerNote.create({
      data: { customerId, authorId, text },
    });
  }
}