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
 * Marca de contexto que indica que una petición ya fue reenviada tras un
 * refresh. Evita bucles infinitos de refresh cuando el reintento también
 * devuelve 401 (p. ej. insuficientes permisos).
 */
const NO_RETRY = new HttpContextToken<boolean>(() => false);

/** Endpoints de autenticación: no se añade el header ni se reintenta el refresh. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/google'];

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => request.url.includes(path));

  // ------------------------------------------------------------------
  // 1. Añadir el token de autorización a la petición (excepto en auth)
  // ------------------------------------------------------------------
  const token = authService.token();
  let authReq = request;
  if (token && !isAuthEndpoint) {
    authReq = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  // ------------------------------------------------------------------
  // 2. Enviar petición y manejar errores de autorización
  // ------------------------------------------------------------------
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo actuar en 401, no en endpoints de auth, y no si ya se reintentó
      if (
        error.status === 401 &&
        !isAuthEndpoint &&
        !request.context.get(NO_RETRY)
      ) {
        // 3. Intentar refrescar el token (con control de concurrencia)
        return from(authService.refreshToken()).pipe(
          switchMap((newToken: string) => {
            // 4. Reenviar la petición original con el nuevo token
            const retryReq = request.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
              context: request.context.set(NO_RETRY, true),
            });
            return next(retryReq);
          }),
          catchError(() => {
            // 5. El refresh falló → cerrar sesión y redirigir al login
                        void authService.logout();
            void router.navigate(['/auth/login']);
            return throwError(() => new Error('Session expired'));
          })
        );
      }

      // Cualquier otro error → propagar sin intervención
      return throwError(() => error);
    })
  );
};
