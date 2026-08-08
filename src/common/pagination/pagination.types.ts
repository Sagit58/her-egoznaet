export type SortDirection = 'asc' | 'desc';

export interface PageQuery {
  readonly page: number;
  readonly pageSize: number;
}

export interface SortQuery<TSortBy extends string> {
  readonly sortBy?: TSortBy;
  readonly sortOrder?: SortDirection;
}

export interface SearchQuery {
  readonly search?: string;
}

export interface Paginated<TItem> {
  readonly items: ReadonlyArray<TItem>;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface ListQuery<TFilter, TSortBy extends string>
  extends PageQuery,
    SearchQuery {
  readonly filter?: TFilter;
  readonly sort?: SortQuery<TSortBy>;
}