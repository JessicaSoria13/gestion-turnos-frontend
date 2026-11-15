import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegistroRequest } from '../../../core/models/auth.model';
import { detallesDeError, mensajeDeError } from '../../../core/utils/errores';

/**
 * Pantalla de Registro (pública). Crea la cuenta de PACIENTE con POST /api/v1/auth/register.
 * No inicia sesión: al terminar muestra el mensaje de éxito y el enlace para ingresar.
 */
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private readonly authService = inject(AuthService);

  dni = '';
  nombreApellido = '';
  fechaNacimiento = '';
  email = '';
  celular = '';
  contrasena = '';
  repetirContrasena = '';

  // El backend exige una fecha de nacimiento pasada (@Past): como máximo, ayer (yyyy-MM-dd, hora local)
  readonly fechaMaxima = RegistroComponent.ayer();

  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  detalles = signal<string[]>([]);
  mensajeExito = signal<string | null>(null);

  registrarme(): void {
    this.mensajeError.set(null);
    this.detalles.set([]);

    if (this.contrasena !== this.repetirContrasena) {
      this.mensajeError.set('Las contraseñas no coinciden');
      return;
    }

    // email y celular son opcionales: si quedaron vacíos no se mandan
    const datos: RegistroRequest = {
      dni: this.dni.trim(),
      contrasena: this.contrasena,
      nombreApellido: this.nombreApellido.trim(),
      fechaNacimiento: this.fechaNacimiento,
    };
    if (this.email.trim()) {
      datos.email = this.email.trim();
    }
    if (this.celular.trim()) {
      datos.celular = this.celular.trim();
    }

    this.cargando.set(true);
    this.authService.registrar(datos).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.mensajeExito.set(respuesta.mensaje);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.mensajeError.set(mensajeDeError(err));
        this.detalles.set(detallesDeError(err));
      },
    });
  }

  private static ayer(): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 1);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
