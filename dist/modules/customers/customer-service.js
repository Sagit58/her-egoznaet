"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const app_error_1 = require("../../common/errors/app-error");
const toDto = (record) => ({
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
class CustomerService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        const record = await this.repository.create(input);
        return toDto(record);
    }
    async getById(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('Customer not found');
        }
        return toDto(record);
    }
    async update(id, input) {
        const record = await this.repository.update(id, input);
        if (!record) {
            throw app_error_1.AppError.notFound('Customer not found');
        }
        return toDto(record);
    }
    async remove(id) {
        const deleted = await this.repository.softDelete(id);
        if (!deleted) {
            throw app_error_1.AppError.notFound('Customer not found');
        }
    }
    async list(args) {
        const result = await this.repository.list(args);
        return { ...result, items: result.items.map(toDto) };
    }
    async addContact(customerId, input) {
        const exists = await this.repository.findById(customerId);
        if (!exists) {
            throw app_error_1.AppError.notFound('Customer not found');
        }
        await this.repository.addContact(customerId, input);
        return this.getById(customerId);
    }
    async removeContact(contactId) {
        const deleted = await this.repository.softDeleteContact(contactId);
        if (!deleted) {
            throw app_error_1.AppError.notFound('Contact not found');
        }
    }
    async addNote(customerId, authorId, text) {
        const exists = await this.repository.findById(customerId);
        if (!exists) {
            throw app_error_1.AppError.notFound('Customer not found');
        }
        await this.repository.addNote(customerId, authorId, text);
        return this.getById(customerId);
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer-service.js.map