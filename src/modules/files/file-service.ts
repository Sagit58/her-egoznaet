import { randomUUID } from 'node:crypto';

import type { FileCategory } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import type { Paginated } from '../../common/pagination/pagination.types';
import type { FileListArgs, FileRecord } from './file-repository';
import { FileRepository } from './file-repository';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './file.schemas';
import type { StorageService } from './storage-service';

export interface FileDto {
  readonly id: string;
  readonly category: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly orderId: string | null;
  readonly customerId: string | null;
  readonly createdAt: string;
  readonly owner: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
  };
}

export interface UploadInput {
  readonly buffer: Buffer;
  readonly fileName: string;
  readonly mimeType: string;
  readonly category: FileCategory;
  readonly ownerId: string;
  readonly orderId?: string;
  readonly customerId?: string;
}

const toDto = (record: FileRecord): FileDto => ({
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

export class FileService {
  constructor(
    private readonly repository: FileRepository,
    private readonly storage: StorageService,
  ) {}

  async upload(input: UploadInput): Promise<FileDto> {
    if (input.buffer.length === 0) {
      throw AppError.badRequest('File is empty');
    }

    if (input.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new AppError({
        code: 'FILE_TOO_LARGE',
        message: 'File is too large',
        statusCode: 413,
      });
    }

    if (
      !ALLOWED_MIME_TYPES.includes(
        input.mimeType as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new AppError({
        code: 'FILE_CATEGORY_INVALID',
        message: `File type ${input.mimeType} is not allowed`,
        statusCode: 400,
      });
    }

    const extension = input.fileName.split('.').pop()?.toLowerCase() ?? 'bin';
    const storageKey = `${randomUUID()}.${extension}`;

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

  async getDownloadUrl(id: string): Promise<{ url: string }> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('File not found');
    }

    const url = await this.storage.presignedUrl(record.storageKey);

    return { url };
  }

  async remove(id: string): Promise<void> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('File not found');
    }

    await this.repository.softDelete(id);
    await this.storage.delete(record.storageKey);
  }

  async list(args: FileListArgs): Promise<Paginated<FileDto>> {
    const result = await this.repository.list(args);

    return { ...result, items: result.items.map(toDto) };
  }
}