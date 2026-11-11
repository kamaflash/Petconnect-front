import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
    HttpContextToken,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';

/**
 * Interceptor de sesión por cookies HttpOnly.
 *
 * Las cookies (PC_AT/PC_RT) las envía el navegador automáticamente. En
 * desarrollo el proxy de Angular hace que todo sea same-origin, pero en
 * producción el front (petconnect.com) y la API (api.petconnect.com) son
 * orígenes distintos: sin `withCredentials` el navegador no enviaría las
 * cookies y el backend respondería 403 a toda ruta protegida.
 *
 * Aquí se gestiona:
 *  - 401 → refresh de sesión y reenvío de la petición original (marca NO_RETRY).
 *  - 403 con `CSRF_INVALID` → se pide un token nuevo a `/csrf-token` y se
 *    reintenta la mutación una única vez.
 *  - 403 con `PROFILE_INCOMPLETE` → redirección al onboarding.
 */

/** Endpoints de autenticación: no se reintenta el refresh. */
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/google',
  '/auth/session',
  '/auth/logout',
  '/auth/change-password',
  '/auth/change-email',
  '/auth/confirm-email'
];
const CSRF_ENDPOINT = '/csrf-token';
const NO_RETRY = new HttpContextToken<boolean>(() => false);

/** Métodos que exigen token CSRF (double-submit). */
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => request.url.includes(path));
  const isCsrfEndpoint = request.url.includes(CSRF_ENDPOINT);

  // Todas las peticiones viajan con credenciales: la sesión vive en cookies
  // HttpOnly y sin esto el navegador no las adjuntaría en cross-origin.
  let req = request.clone({ withCredentials: true });

  // Adjuntar el token CSRF manualmente en las mutaciones.
  //
  // Angular solo lo hace de forma automática para URLs same-origin. En
  // producción la API está en `api.petconnect.com` y el front en
  // `petconnect.com`, así que el token nunca se enviaba y toda mutación
  // terminaba en 403 por CSRF. Se resuelve con el token en memoria que
  // `AuthService` obtiene de `/csrf-token` (con fallback a la cookie).
  if (MUTATING_METHODS.includes(req.method.toUpperCase())) {
    const token = authService.getCsrfToken();
    if (token && !req.headers.has('X-XSRF-TOKEN')) {
      req = req.clone({ setHeaders: { 'X-XSRF-TOKEN': token } });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo actuar en 401, no en endpoints de auth, y no si ya se reintentó
      if (
        error.status === 401 &&
        !isAuthEndpoint &&
        !req.context.get(NO_RETRY)
      ) {
        // Intentar refrescar la sesión (con control de concurrencia)
        return from(authService.refreshToken()).pipe(
          switchMap(() => {
            // Reenviar la petición original (las cookies ya están renovadas)
            const retryReq = req.clone({
              context: req.context.set(NO_RETRY, true),
            });
            return next(retryReq);
          }),
          catchError(() => {
            // El refresh falló → cerrar sesión y redirigir al login
            void authService.logout().catch((logoutError: unknown) => {
              console.error('Could not complete logout after session refresh failed.', logoutError);
            });
            void router.navigate(['/auth/login']);
            return throwError(() => new Error('Session expired'));
          })
        );
      }

      // 403 por CSRF: el token de la cookie no coincide con el de la cabecera
      // (p. ej. cookie caducada, rotada o ausente en cross-origin). Se pide
      // un token nuevo y se reintenta la mutación una sola vez.
      if (
        error.status === 403 &&
        error.error?.error === 'CSRF_INVALID' &&
        !isCsrfEndpoint &&
        !req.context.get(NO_RETRY)
      ) {
        return from(authService.ensureCsrfToken()).pipe(
          switchMap(() => {
            // Reenviar la petición original con el token actualizado.
            let retryReq = req.clone({
              context: req.context.set(NO_RETRY, true),
            });
            const freshToken = authService.getCsrfToken();
            if (freshToken) {
              retryReq = retryReq.clone({
                setHeaders: { 'X-XSRF-TOKEN': freshToken },
              });
            }
            return next(retryReq);
          }),
          catchError(() => throwError(() => error))
        );
      }

      // El backend bloquea las escrituras mientras el perfil no este
      // completo (403 + codigo `PROFILE_INCOMPLETE`): el usuario debe pasar
      // por el onboarding. Se redirige ahi en lugar de propagar el error.
      if (error.status === 403 && error.error?.error === 'PROFILE_INCOMPLETE') {
        void router.navigate(['/onboarding']);
        return throwError(() => error);
      }

      // Cualquier otro error → propagar sin intervención
      return throwError(() => error);
    })
  );
};
