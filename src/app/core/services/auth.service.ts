import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConfirmarRecuperacionRequest,
  LoginRequest,
  LoginResponse,
  MensajeResponse,
  RegistroRequest,
  RegistroResponse,
  Rol,
  SolicitarRecuperacionRequest,
} from '../models/auth.model';

/**
 * Servicio encargado de la Autenticación contra Spring Security (JWT).
 * Maneja el login, el registro, la recuperación de contraseña, el guardado del token y el rol
 * en `localStorage` y el cierre de sesión.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly authUrl = `${environment.apiUrl}/auth`;

  private readonly TOKEN_KEY = 'token';
  private readonly ROL_KEY = 'rol';

  // Signals reactivos: la barra de navegación y los guards saben en todo momento si hay sesión y con qué rol
  estaAutenticado = signal<boolean>(!!localStorage.getItem(this.TOKEN_KEY));
  rolActual = signal<Rol | null>(localStorage.getItem(this.ROL_KEY) as Rol | null);

  /**
   * POST /api/v1/auth/login. Si el backend responde con el JWT, se guardan el token y el rol.
   * Errores posibles: 401 (DNI o contraseña incorrectos) y 400 (el DNI tiene dos roles y no se indicó cuál).
   */
  login(credenciales: LoginRequest): Observable<LoginResponse> {
    // Si quedó una sesión vieja, se borra antes de intentar el nuevo login
    this.logout();
    return this.http
      .post<LoginResponse>(`${this.authUrl}/login`, credenciales)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta.token, respuesta.rol)));
  }

  /**
   * POST /api/v1/auth/register (201). Crea la cuenta de PACIENTE; no inicia sesión.
   * Errores posibles: 400 (validación, con `detalles`) y 409 (ya existe un usuario activo con ese DNI).
   */
  registrar(datos: RegistroRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.authUrl}/register`, datos);
  }

  /**
   * POST /api/v1/auth/recuperar-contrasena/solicitar. El backend envía un código al email.
   * Responde siempre el mismo mensaje (exista o no el email) para no revelar qué cuentas existen.
   */
  solicitarRecuperacion(datos: SolicitarRecuperacionRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.authUrl}/recuperar-contrasena/solicitar`, datos);
  }

  /**
   * POST /api/v1/auth/recuperar-contrasena/confirmar. Cambia la contraseña con el código del email.
   * Error posible: 401 (código inválido, ya usado o vencido).
   */
  confirmarRecuperacion(datos: ConfirmarRecuperacionRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.authUrl}/recuperar-contrasena/confirmar`, datos);
  }

  /** Elimina el token y el rol de localStorage para cerrar la sesión. */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROL_KEY);
    this.estaAutenticado.set(false);
    this.rolActual.set(null);
  }

  /** Devuelve el token JWT actual guardado en el navegador (o null si no inició sesión). */
  obtenerToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Pantalla de inicio según el rol con el que se ingresó. */
  rutaInicio(rol: Rol | null = this.rolActual()): string {
    return rol === 'ADMINISTRADOR' ? '/admin/agenda' : '/paciente/reservar';
  }

  private guardarSesion(token: string, rol: Rol): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROL_KEY, rol);
    this.estaAutenticado.set(true);
    this.rolActual.set(rol);
  }
}
