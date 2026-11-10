import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

/**
 * Configuración global de la aplicación Angular 22 (Standalone).
 * - `provideRouter(routes, withComponentInputBinding())`: habilita el enrutador y permite que
 *   los `data` de cada ruta lleguen a los componentes como `input()` (ej: el título).
 * - `provideHttpClient(withFetch(), withInterceptors([jwtInterceptor]))`: habilita el cliente HTTP
 *   e inyecta automáticamente el token JWT (`Authorization: Bearer ...`) en cada petición al backend.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor])),
  ],
};
