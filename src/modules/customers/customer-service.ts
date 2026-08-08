import { AppError } from '../../common/errors/app-error';
import type { Paginated } from '../../common/pagination/pagination.types';
import type {
  CustomerContactInput,
  CustomerListArgs,
  CustomerRecord,
  CustomerUpdateInput,
  CustomerWriteInput,
} from './customer-repository';
import { CustomerRepository } from './customer-repository';

export interface CustomerContactDto {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly relation: string | null;
  readonly createdAt: string;
}

export interface CustomerNoteDto {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
  readonly author: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
  };
}

export interface CustomerGraveSiteDto {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
}

export interface CustomerDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName: string | null;
  readonly phone: string;
  readonly email: string | null;
  readonly comment: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly contacts: ReadonlyArray<CustomerContactDto>;
  readonly notes: ReadonlyArray<CustomerNoteDto>;
  readonly graveSites: ReadonlyArray<CustomerGraveSiteDto>;
}

const toDto = (record: CustomerRecord): CustomerDto => ({
  id: record.id,
  firstName: record.firstName,
  lastName: record.lastName,
  middleName: record.middleName,
  phone: record.phone,
  email: record.email,
  comment: record.comment,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  contacts: record.contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    relation: contact.relation,
    createdAt: contact.createdAt.toISOString(),
  })),
  notes: record.notes.map((note) => ({
    id: note.id,
    text: note.text,
    createdAt: note.createdAt.toISOString(),
    author: note.author,
  })),
  graveSites: record.graveSites,
});

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  async create(input: CustomerWriteInput): Promise<CustomerDto> {
    const record = await this.repository.create(input);

    return toDto(record);
  }

  async getById(id: string): Promise<CustomerDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('Customer not found');
    }

    return toDto(record);
  }

  async update(id: string, input: CustomerUpdateInput): Promise<CustomerDto> {
    const record = await this.repository.update(id, input);

    if (!record) {
      throw AppError.notFound('Customer not found');
    }

    return toDto(record);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);

    if (!deleted) {
      throw AppError.notFound('Customer not found');
    }
  }

  async list(args: CustomerListArgs): Promise<Paginated<CustomerDto>> {
    const result = await this.repository.list(args);

    return { ...result, items: result.items.map(toDto) };
  }

  async addContact(
    customerId: string,
    input: CustomerContactInput,
  ): Promise<CustomerDto> {
    const exists = await this.repository.findById(customerId);

    if (!exists) {
      throw AppError.notFound('Customer not found');
    }

    await this.repository.addContact(customerId, input);

    return this.getById(customerId);
  }

  async removeContact(contactId: string): Promise<void> {
    const deleted = await this.repository.softDeleteContact(contactId);

    if (!deleted) {
      throw AppError.notFound('Contact not found');
    }
  }

  async addNote(
    customerId: string,
    authorId: string,
    text: string,
  ): Promise<CustomerDto> {
    const exists = await this.repository.findById(customerId);

    if (!exists) {
      throw AppError.notFound('Customer not found');
    }

    await this.repository.addNote(customerId, authorId, text);

    return this.getById(customerId);
  }
}