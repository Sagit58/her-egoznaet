import { AppError } from '../../common/errors/app-error';
import type { Paginated } from '../../common/pagination/pagination.types';
import type {
  BranchListArgs,
  BranchRecord,
  BranchUpdateInput,
  BranchWriteInput,
} from './branch-repository';
import { BranchRepository } from './branch-repository';

export interface BranchDto {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
  readonly phone: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const toDto = (record: BranchRecord): BranchDto => ({
  id: record.id,
  name: record.name,
  address: record.address,
  phone: record.phone,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class BranchService {
  constructor(private readonly repository: BranchRepository) {}

  async create(input: BranchWriteInput): Promise<BranchDto> {
    const record = await this.repository.create(input);

    return toDto(record);
  }

  async getById(id: string): Promise<BranchDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('Branch not found');
    }

    return toDto(record);
  }

  async update(id: string, input: BranchUpdateInput): Promise<BranchDto> {
    const record = await this.repository.update(id, input);

    if (!record) {
      throw AppError.notFound('Branch not found');
    }

    return toDto(record);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);

    if (!deleted) {
      throw AppError.notFound('Branch not found');
    }
  }

  async list(args: BranchListArgs): Promise<Paginated<BranchDto>> {
    const result = await this.repository.list(args);

    return { ...result, items: result.items.map(toDto) };
  }
}