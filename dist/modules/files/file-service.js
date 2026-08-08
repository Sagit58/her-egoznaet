"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const node_crypto_1 = require("node:crypto");
const app_error_1 = require("../../common/errors/app-error");
const file_schemas_1 = require("./file.schemas");
const toDto = (record) => ({
    id: record.id,
    category: record.category,
    originalName: record.originalName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    orderId: record.orderId,
    customerId: record.customerId,
    createdAt: record.createdAt.toISOString(),
    owner: record.owner,
});
class FileService {
    repository;
    storage;
    constructor(repository, storage) {
        this.repository = repository;
        this.storage = storage;
    }
    async upload(input) {
        if (input.buffer.length === 0) {
            throw app_error_1.AppError.badRequest('File is empty');
        }
        if (input.buffer.length > file_schemas_1.MAX_FILE_SIZE_BYTES) {
            throw new app_error_1.AppError({
                code: 'FILE_TOO_LARGE',
                message: 'File is too large',
                statusCode: 413,
            });
        }
        if (!file_schemas_1.ALLOWED_MIME_TYPES.includes(input.mimeType)) {
            throw new app_error_1.AppError({
                code: 'FILE_CATEGORY_INVALID',
                message: `File type ${input.mimeType} is not allowed`,
                statusCode: 400,
            });
        }
        const extension = input.fileName.split('.').pop()?.toLowerCase() ?? 'bin';
        const storageKey = `${(0, node_crypto_1.randomUUID)()}.${extension}`;
        await this.storage.put(storageKey, input.buffer, input.mimeType);
        const record = await this.repository.create({
            ownerId: input.ownerId,
            category: input.category,
            originalName: input.fileName,
            mimeType: input.mimeType,
            sizeBytes: input.buffer.length,
            storageKey,
            orderId: input.orderId ?? null,
            customerId: input.customerId ?? null,
        });
        return toDto(record);
    }
    async getDownloadUrl(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('File not found');
        }
        const url = await this.storage.presignedUrl(record.storageKey);
        return { url };
    }
    async remove(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('File not found');
        }
        await this.repository.softDelete(id);
        await this.storage.delete(record.storageKey);
    }
    async list(args) {
        const result = await this.repository.list(args);
        return { ...result, items: result.items.map(toDto) };
    }
}
exports.FileService = FileService;
//# sourceMappingURL=file-service.js.map