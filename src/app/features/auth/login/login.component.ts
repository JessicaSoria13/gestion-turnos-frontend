import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest, Rol } from '../../../core/models/auth.model';
import { mensajeDeError } from '../../../core/utils/errores';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  dni = '';
  contrasena = '';
  rol: Rol | '' = '';

  // Se muestra el selector de rol solo cuando el backend avisa que el DNI tiene los dos roles
  pedirRol = signal<boolean>(false);
  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  /**
   * POST /api/v1/auth/login. Si sale bien, AuthService guarda el token y el rol,
   * y se redirige a la pantalla de inicio de ese rol.
   */
  iniciarSesion(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);

    const credenciales: LoginRequest = { dni: this.dni, contrasena: this.contrasena };
    if (this.rol) {
      credenciales.rol = this.rol;
    }

    this.authService.login(credenciales).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.router.navigate([this.authService.rutaInicio(respuesta.rol)]);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        // 400 sin rol elegido = el DNI tiene los dos roles activos
        if (err instanceof HttpErrorResponse && err.status === 400 && !this.rol) {
          this.pedirRol.set(true);
        }
        this.mensajeError.set(mensajeDeError(err));
      },
    });
  }
}
