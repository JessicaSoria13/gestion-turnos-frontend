/**
 * Modelos para el flujo de Autenticación con Spring Security + JWT.
 * Reflejan los DTOs del backend (paquete com.turnosmedicos.backend.dto).
 */

/** Roles del sistema (enum Rol del backend). */
export type Rol = 'PACIENTE' | 'ADMINISTRADOR';

/** LoginRequestDTO: `rol` solo hace falta si el DNI tiene los dos roles activos. */
export interface LoginRequest {
  dni: string;
  contrasena: string;
  rol?: Rol;
}

/** LoginResponseDTO */
export interface LoginResponse {
  token: string;
  rol: Rol;
}

/** ErrorResponse: formato de todos los errores que devuelve el backend. */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
  detalles: string[] | null;
}
