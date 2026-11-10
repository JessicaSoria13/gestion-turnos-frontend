import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

interface Enlace {
  ruta: string;
  texto: string;
}

// Links del menú según el rol con el que se ingresó
const ENLACES_POR_ROL: Record<string, Enlace[]> = {
  PACIENTE: [
    { ruta: '/paciente/reservar', texto: 'Reservar turno' },
    { ruta: '/paciente/mis-turnos', texto: 'Mis turnos' },
  ],
  ADMINISTRADOR: [
    { ruta: '/admin/agenda', texto: 'Agenda' },
    { ruta: '/admin/pacientes', texto: 'Pacientes' },
    { ruta: '/admin/historial', texto: 'Historial clínico' },
  ],
};

const NOMBRE_ROL: Record<string, string> = {
  PACIENTE: 'Paciente',
  ADMINISTRADOR: 'Administrador',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly enlaces = computed(() => ENLACES_POR_ROL[this.authService.rolActual() ?? ''] ?? []);
  readonly nombreRol = computed(() => NOMBRE_ROL[this.authService.rolActual() ?? ''] ?? '');

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
