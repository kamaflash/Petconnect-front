import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, from } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token && token.trim() !== '') {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Intentar refresh token
        if (!isRefreshing) {
          isRefreshing = true;
          return from(authService.refreshToken()).pipe(
            switchMap((newToken: string) => {
              isRefreshing = false;
              // Reintentar la petición original con el nuevo token
              const clonedRequest = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(clonedRequest);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              // Refresh falló, limpiar token y redirigir al login
              authService.clearToken();
              authService.logout();
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
