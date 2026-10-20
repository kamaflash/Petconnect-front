import { HttpParams } from '@angular/common/http';

/**
 * Contrato estándar de paginación servidor (10×10).
 * Réplica del `PageResponse<T>` del backend: `content` con la página actual,
 * `totalElements`/`totalPages` para el paginador y `last` para scroll infinito.
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  last: boolean;
}

/** Tamaño de página por defecto en todos los listados. */
export const DEFAULT_PAGE_SIZE = 10;

/** Parámetros de paginación aceptados por los servicios de colección. */
export interface PageRequest {
  page?: number;
  size?: number;
}

/**
 * Construye los `HttpParams` de paginación (`page`, `size`) con saneo:
 * página mínima 0 y tamaño 1–50 (por defecto {@link DEFAULT_PAGE_SIZE}).
 */
export function pageParams(params: HttpParams, request: PageRequest): HttpParams {
  const page = Math.max(request.page ?? 0, 0);
  const size = Math.min(Math.max(request.size ?? DEFAULT_PAGE_SIZE, 1), 50);
  return params.set('page', String(page)).set('size', String(size));
}
