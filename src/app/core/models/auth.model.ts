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

/** RegistroRequestDTO: crea el Usuario (rol PACIENTE) y su Paciente. `fechaNacimiento` en formato yyyy-MM-dd. */
export interface RegistroRequest {
  dni: string;
  contrasena: string;
  nombreApellido: string;
  email?: string;
  celular?: string;
  fechaNacimiento: string;
}

/** RegistroResponseDTO */
export interface RegistroResponse {
  idUsuario: number;
  idPaciente: number;
  mensaje: string;
}

/** SolicitarRecuperacionRequestDTO: el backend manda un código al email (vence en 30 minutos). */
export interface SolicitarRecuperacionRequest {
  email: string;
}

/** ConfirmarRecuperacionRequestDTO: `token` es el código que llegó por email. */
export interface ConfirmarRecuperacionRequest {
  token: string;
  contrasenaNueva: string;
}

/** MensajeResponseDTO */
export interface MensajeResponse {
  mensaje: string;
}

/** ErrorResponse: formato de todos los errores que devuelve el backend. */
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
  detalles: string[] | null;
}
