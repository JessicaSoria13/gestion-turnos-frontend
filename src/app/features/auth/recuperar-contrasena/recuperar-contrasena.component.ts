import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { detallesDeError, mensajeDeError } from '../../../core/utils/errores';

/**
 * Pantalla de Recuperar contraseña (pública), en dos pasos:
 * 1. 'solicitar': el paciente ingresa su email y el backend le manda un código (vence en 30 minutos).
 * 2. 'confirmar': ingresa el código y la contraseña nueva.
 * Al terminar ('listo') muestra el mensaje de éxito y el enlace para ingresar.
 */
@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
