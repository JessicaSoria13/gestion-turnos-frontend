import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

/**
 * Configuración global de la aplicación Angular 22 (Standalone).
 * - `provideRouter(routes)`: habilita el enrutador con las rutas de app.routes.ts.
 * - `provideHttpClient(withFetch(), withInterceptors([jwtInterceptor]))`: habilita el cliente HTTP
 *   e inyecta automáticamente el token JWT (`Authorization: Bearer ...`) en cada petición al backend.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor])),
  ],
};
