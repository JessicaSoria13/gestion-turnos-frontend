import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional para Spring Security (JWT).
 *
 * 1. Antes de cada petición: si hay un token guardado, le agrega `Authorization: Bearer <token>`.
 * 2. Si el backend responde 401 y la petición llevaba token (sesión vencida o inválida):
 *    cierra la sesión y vuelve a /login.
 *    Si NO llevaba token (por ejemplo, el propio login con contraseña incorrecta), el error
 *    sigue de largo para que la pantalla muestre el mensaje del backend.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.obtenerToken();

  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
