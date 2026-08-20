import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';

/**
 * Guard de autenticación.
 *
 * Impide el acceso a las rutas protegidas cuando el usuario no está autenticado
 * o su token JWT está expirado, redirigiéndolo a la página de login.
 *
 * Nota: `AuthService.isAuthenticated()` solo verifica la presencia del token,
 * por eso aquí también se comprueba `isTokenExpired()` para no dejar pasar
 * sesiones vencidas que aún residen en sessionStorage.
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && !authService.isTokenExpired()) {
    return true;
  }

  // Token inexistente o expirado → limpiar sesión y redirigir al login
  void authService.logout();
  return router.createUrlTree(['/auth/login']);
};
