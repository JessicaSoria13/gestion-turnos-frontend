import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { Toasts } from './shared/toasts/toasts';

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
    { ruta: '/admin/turnos', texto: 'Turnos del día' },
    { ruta: '/admin/agenda', texto: 'Agenda' },
    { ruta: '/admin/pacientes', texto: 'Pacientes' },
    { ruta: '/admin/historial', texto: 'Historial clínico' },
  ],
};

const NOMBRE_ROL: Record<string, string> = {
  PACIENTE: 'Paciente',
  ADMINISTRADOR: 'Administrador',
};

// Pantallas de acceso: tienen su propio diseño, sin el encabezado ni el pie de la app
const RUTAS_PUBLICAS = ['/login', '/registro', '/recuperar-contrasena'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly enlaces = computed(() => ENLACES_POR_ROL[this.authService.rolActual() ?? ''] ?? []);
  readonly nombreRol = computed(() => NOMBRE_ROL[this.authService.rolActual() ?? ''] ?? '');

  // URL actual: se actualiza cada vez que termina una navegación
  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** true en /login, /registro y /recuperar-contrasena (ahí no se muestran el encabezado ni el pie). */
  readonly esPantallaDeAcceso = computed(() =>
    RUTAS_PUBLICAS.some((ruta) => this.urlActual().startsWith(ruta)),
  );

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
