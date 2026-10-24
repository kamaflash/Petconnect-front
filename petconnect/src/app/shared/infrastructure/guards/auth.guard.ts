import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';

/**
 * Guard de autenticación.
 *
 * Con sesión por cookies HttpOnly no hay token visible en el frontend: la
 * presencia de `AuthService.user()` (restaurada vía GET /session al
 * arrancar) determina el acceso. Si la sesión aún se está restaurando, se
 * espera a que termine antes de decidir.
 */
export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.sessionReady()) {
    return decideAuth(authService, router);
  }
  return from(authService.restoreSession()).pipe(
    map(() => decideAuth(authService, router))
  );
};

function decideAuth(authService: AuthService, router: Router): boolean | UrlTree {
  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/auth/login']);
}

/**
 * Guard de onboarding.
 *
 * Impide el acceso a las rutas protegidas a los usuarios que aún no han
 * completado su perfil (tras el registro o el primer acceso con Google),
 * redirigiéndolos al flujo de onboarding.
 *
 * Usa el estado local de `AuthService.profileComplete`, que se actualiza de
 * inmediato al guardar el perfil (el claim del JWT puede quedar obsoleto).
 */
export const profileCompletedGuard: CanActivateFn = (): Observable<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Sin sesión el guard de autenticación se encarga.
  if (!authService.isAuthenticated()) {
    return true;
  }

  if (authService.profileComplete()) {
    return true;
  }

  return router.createUrlTree(['/onboarding']);
};
