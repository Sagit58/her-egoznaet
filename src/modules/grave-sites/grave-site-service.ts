import { Prisma } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import type { Paginated } from '../../common/pagination/pagination.types';
import type {
  BurialUpdateInput,
  BurialWriteInput,
  GraveSiteListArgs,
  GraveSiteRecord,
  GraveSiteUpdateInput,
  GraveSiteWriteInput,
} from './grave-site-repository';
import { GraveSiteRepository } from './grave-site-repository';

export interface BurialDto {
  readonly id: string;
  readonly graveSiteId: string;
  readonly fullName: string;
  readonly birthDate: string | null;
  readonly deathDate: string | null;
  readonly comment: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface GraveSiteCustomerDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
}

export interface GraveSiteDto {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly size: string | null;
  readonly features: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly customer: GraveSiteCustomerDto;
  readonly burials: ReadonlyArray<BurialDto>;
}

const toBurialDto = (
  burial: GraveSiteRecord['burials'][number],
): BurialDto => ({
  id: burial.id,
  graveSiteId: burial.graveSiteId,
  fullName: burial.fullName,
  birthDate: burial.birthDate?.toISOString() ?? null,
  deathDate: burial.deathDate?.toISOString() ?? null,
  comment: burial.comment,
  createdAt: burial.createdAt.toISOString(),
  updatedAt: burial.updatedAt.toISOString(),
});

const toDto = (record: GraveSiteRecord): GraveSiteDto => ({
  id: record.id,
  name: record.name,
  address: record.address,
  latitude: record.latitude,
  longitude: record.longitude,
  size: record.size,
  features: record.features,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  customer: record.customer,
  burials: record.burials.map(toBurialDto),
});

export class GraveSiteService {
  constructor(private readonly repository: GraveSiteRepository) {}

  async create(input: GraveSiteWriteInput): Promise<GraveSiteDto> {
    try {
      const record = await this.repository.create(input);

      return toDto(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw AppError.notFound('Customer not found');
      }

      throw error;
    }
  }

  async getById(id: string): Promise<GraveSiteDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('Grave site not found');
    }

    return toDto(record);
  }

  async update(
    id: string,
    input: GraveSiteUpdateInput,
  ): Promise<GraveSiteDto> {
    const record = await this.repository.update(id, input);

    if (!record) {
      throw AppError.notFound('Grave site not found');
    }

    return toDto(record);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);

    if (!deleted) {
      throw AppError.notFound('Grave site not found');
    }
  }

  async list(args: GraveSiteListArgs): Promise<Paginated<GraveSiteDto>> {
    const result = await this.repository.list(args);

    return { ...result, items: result.items.map(toDto) };
  }

  async addBurial(
    graveSiteId: string,
    input: BurialWriteInput,
  ): Promise<GraveSiteDto> {
    const exists = await this.repository.findById(graveSiteId);

    if (!exists) {
      throw AppError.notFound('Grave site not found');
    }

    const record = await this.repository.addBurial(graveSiteId, input);

    return toDto(record);
  }

  async updateBurial(burialId: string, input: BurialUpdateInput): Promise<void> {
    const updated = await this.repository.updateBurial(burialId, input);

    if (!updated) {
      throw AppError.notFound('Burial not found');
    }
  }

  async removeBurial(burialId: string): Promise<void> {
    const deleted = await this.repository.softDeleteBurial(burialId);

    if (!deleted) {
      throw AppError.notFound('Burial not found');
    }
  }
}