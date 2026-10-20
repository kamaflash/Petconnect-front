import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export type SearchResultType = 'user' | 'pet' | 'service' | 'event';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  image: string;
  route: string;
}

/** Estructura paginada devuelta por `GET /users/providers`. */
interface ProviderPage {
  content?: any[];
}

interface ProfileLike {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  storeName?: string | null;
  specialty?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
}

interface PetLike {
  id?: string;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  avatarUrl?: string | null;
  imageUrls?: string[] | null;
}

interface EventLike {
  id?: string;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  imageUrl?: string | null;
}

const includes = (value: string | null | undefined, q: string): boolean =>
  !!value && value.toLowerCase().includes(q);

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Búsqueda global: consulta en paralelo usuarios, proveedores (vet/protectoras),
   * mascotas y eventos, y fusiona los resultados.
   */
  search(query: string): Observable<SearchResult[]> {
    const q = (query ?? '').trim().toLowerCase();
    if (!q) {
      return of([]);
    }

    const users$ = this.http
      .get<ProfileLike[]>(`${this.apiUrl}/users/profiles`)
      .pipe(
        map((profiles) =>
          (profiles ?? [])
            .filter(
              (p) =>
                includes(p.firstName, q) ||
                includes(p.lastName, q) ||
                includes(p.storeName, q) ||
                includes(p.specialty, q) ||
                includes(p.location, q)
            )
            .map((p) => ({
              id: p.id ?? '',
              type: 'user' as SearchResultType,
              title: this.userTitle(p),
              subtitle: p.location ?? '',
              image: p.avatarUrl ?? '',
              route: `/profile/${p.id}`,
            }))
        ),
        catchError(() => of([] as SearchResult[]))
      );

    const providers$ = this.http
      .get<ProviderPage>(`${this.apiUrl}/users/providers`, {
        params: new HttpParams().set('profileType', 'vet').set('size', 50),
      })
      .pipe(
        map((page) =>
          (page?.content ?? [])
            .filter(
              (p: ProfileLike) =>
                includes(p.storeName, q) ||
                includes(p.specialty, q) ||
                includes(p.location, q) ||
                includes(p.firstName, q)
            )
            .map((p: ProfileLike) => ({
              id: p.id ?? '',
              type: 'service' as SearchResultType,
              title: p.storeName ?? this.userTitle(p),
              subtitle: p.specialty ?? p.location ?? '',
              image: p.avatarUrl ?? '',
              route: `/profile/${p.id}`,
            }))
        ),
        catchError(() => of([] as SearchResult[]))
      );

    const shelters$ = this.http
      .get<ProviderPage>(`${this.apiUrl}/users/providers`, {
        params: new HttpParams().set('profileType', 'shelter').set('size', 50),
      })
      .pipe(
        map((page) =>
          (page?.content ?? [])
            .filter(
              (s: ProfileLike) =>
                includes(s.storeName, q) ||
                includes(s.location, q) ||
                includes(s.firstName, q)
            )
            .map((s: ProfileLike) => ({
              id: s.id ?? '',
              type: 'service' as SearchResultType,
              title: s.storeName ?? this.userTitle(s),
              subtitle: s.location ?? '',
              image: s.avatarUrl ?? '',
              route: `/profile/${s.id}`,
            }))
        ),
        catchError(() => of([] as SearchResult[]))
      );

    const events$ = this.http
      .get<EventLike[]>(`${this.apiUrl}/social/events`)
      .pipe(
        map((events) =>
          (events ?? [])
            .filter(
              (e) =>
                includes(e.title, q) ||
                includes(e.description, q) ||
                includes(e.location, q)
            )
            .map((e) => ({
              id: e.id ?? '',
              type: 'event' as SearchResultType,
              title: e.title ?? '',
              subtitle: e.location ?? '',
              image: e.imageUrl ?? '',
              route: '/events',
            }))
        ),
        catchError(() => of([] as SearchResult[]))
      );

    const pets$ = this.http.get<PetLike[]>(`${this.apiUrl}/pets`).pipe(
      map((pets) =>
        (pets ?? [])
          .filter(
            (p) =>
              includes(p.name, q) ||
              includes(p.species, q) ||
              includes(p.breed, q)
          )
          .map((p) => ({
            id: p.id ?? '',
            type: 'pet' as SearchResultType,
            title: p.name ?? '',
            subtitle: [p.species, p.breed].filter(Boolean).join(' · '),
            image: p.avatarUrl ?? p.imageUrls?.[0] ?? '',
            route: `/profile/pet/${p.id}`,
          }))
      ),
      catchError(() => of([] as SearchResult[]))
    );

    return forkJoin([users$, providers$, shelters$, events$, pets$]).pipe(
      map(([users, providers, shelters, events, pets]) =>
        [...users, ...providers, ...shelters, ...events, ...pets].slice(0, 12)
      )
    );
  }

  private userTitle(p: ProfileLike): string {
    const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
    return fullName || p.storeName || 'Usuario';
  }
}
