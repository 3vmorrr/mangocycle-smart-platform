/**
 * Common data types and API result envelopes per 24-API-SPECIFICATION.md
 */

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type Result<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never; fieldErrors?: Record<string, string[]> };

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
