import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { detallesDeError, mensajeDeError } from '../../../core/utils/errores';
import { LayoutAcceso } from '../../../shared/layout-acceso/layout-acceso';

/**
 * Pantalla de Recuperar contraseña (pública), en dos pasos:
 * 1. 'solicitar': el paciente ingresa su email y el backend le manda un código (vence en 30 minutos).
 * 2. 'confirmar': ingresa el código y la contraseña nueva. Si ya tiene un código (por ejemplo, cerró la
 *    pestaña después de pedirlo), entra directo con "Ya tengo un código".
 * Al terminar ('listo') muestra el mensaje de éxito y el enlace para ingresar.
 */
@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [FormsModule, RouterLink, LayoutAcceso],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrl: './recuperar-contrasena.component.css',
})
export class RecuperarContrasenaComponent {
  private readonly authService = inject(AuthService);

  paso = signal<'solicitar' | 'confirmar' | 'listo'>('solicitar');

  email = '';
  codigo = '';
  contrasenaNueva = '';
  repetirContrasena = '';

  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  detalles = signal<string[]>([]);
  mensajeExito = signal<string | null>(null);
  // Solo visual: los botones ojo alternan entre ver y ocultar cada contraseña
  verContrasena = signal<boolean>(false);
  verRepetir = signal<boolean>(false);

  /** Paso 1: POST /api/v1/auth/recuperar-contrasena/solicitar */
  solicitarCodigo(): void {
    this.limpiarMensajes();
    this.cargando.set(true);
    this.authService.solicitarRecuperacion({ email: this.email.trim() }).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.mensajeExito.set(respuesta.mensaje);
        this.paso.set('confirmar');
      },
      error: (err: unknown) => this.mostrarError(err),
    });
  }

  /** Paso 2: POST /api/v1/auth/recuperar-contrasena/confirmar */
  cambiarContrasena(): void {
    this.limpiarMensajes();
    if (this.contrasenaNueva !== this.repetirContrasena) {
      this.mensajeError.set('Las contraseñas no coinciden');
      return;
    }

    this.cargando.set(true);
    this.authService
      .confirmarRecuperacion({ token: this.codigo.trim(), contrasenaNueva: this.contrasenaNueva })
      .subscribe({
        next: (respuesta) => {
          this.cargando.set(false);
          this.mensajeExito.set(respuesta.mensaje);
          this.paso.set('listo');
        },
        error: (err: unknown) => this.mostrarError(err),
      });
  }

  /** Va al paso 2 sin pedir un código nuevo: el código del email sigue valiendo hasta que vence. */
  yaTengoCodigo(): void {
    this.limpiarMensajes();
    this.paso.set('confirmar');
  }

  /** Vuelve al paso 1 (por ejemplo, si no llegó el email o el código venció). */
  pedirOtroCodigo(): void {
    this.limpiarMensajes();
    this.codigo = '';
    this.paso.set('solicitar');
  }

  private limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.detalles.set([]);
    this.mensajeExito.set(null);
  }

  private mostrarError(err: unknown): void {
    this.cargando.set(false);
    this.mensajeError.set(mensajeDeError(err));
    this.detalles.set(detallesDeError(err));
  }
}
