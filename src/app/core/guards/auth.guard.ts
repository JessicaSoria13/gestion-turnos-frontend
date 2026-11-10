import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/auth.model';

/**
 * Guard de navegación: deja pasar solo si hay sesión iniciada (token guardado).
 * Si no, redirige a /login.
 *
 * Uso en `app.routes.ts`: `{ path: '...', component: ..., canActivate: [authGuard] }`
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

/**
 * Guard por rol: deja pasar solo si hay sesión iniciada CON ese rol.
 * Las rutas /paciente/... son solo para PACIENTE y /admin/... solo para ADMINISTRADOR.
 *
 * Uso en `app.routes.ts`: `canActivate: [rolGuard('PACIENTE')]`
 */
export function rolGuard(rolRequerido: Rol): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.estaAutenticado() && authService.rolActual() === rolRequerido) {
      return true;
    }
    return router.createUrlTree(['/login']);
  };
}
