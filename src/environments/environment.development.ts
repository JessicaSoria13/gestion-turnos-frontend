// Configuración de variables de entorno para Desarrollo (cuando corremos `npm start` o `ng serve`).
// Las llamadas van a `/api/v1/...` en el mismo origen (localhost:4200) y el proxy de desarrollo
// (proxy.conf.mjs) las redirige al backend Spring Boot en http://localhost:8081, sin el header
// Origin. Así el backend no aplica CORS y no hace falta tocar SecurityConfig.
export const environment = {
  production: false,
  apiUrl: '/api/v1',
};
