import type { Paginated } from './pagination.types';

export interface NormalizedPage {
  readonly page: number;
  readonly pageSize: number;
  readonly skip: number;
  readonly take: number;
}

export const normalizePage = (
  page?: number,
  pageSize?: number,
): NormalizedPage => {
  const safePage = page !== undefined && page > 0 ? page : 1;
  const safeSize =
    pageSize !== undefined && pageSize > 0 ? Math.min(pageSize, 100) : 20;

  return {
    page: safePage,
    pageSize: safeSize,
    skip: (safePage - 1) * safeSize,
    take: safeSize,
  };
};

export const buildPaginated = <TItem>(
  items: ReadonlyArray<TItem>,
  total: number,
  page: NormalizedPage,
): Paginated<TItem> => ({
  items,
  page: page.page,
  pageSize: page.pageSize,
  total,
  totalPages: Math.ceil(total / page.pageSize),
});