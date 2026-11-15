import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { EnConstruccionComponent } from './features/en-construccion/en-construccion.component';
import { rolGuard } from './core/guards/auth.guard';
import { Agenda } from './features/agenda/agenda/agenda';
import { ReservarTurnoComponent } from './features/turnos/reservar-turno/reservar-turno.component';
import { MisTurnosComponent } from './features/turnos/mis-turnos/mis-turnos.component';

/**
 * Rutas del Frontend.
 * - Públicas: /login, /registro, /recuperar-contrasena.
 * - /paciente/... solo para PACIENTE y /admin/... solo para ADMINISTRADOR (rolGuard).
 *
 * Las pantallas que todavía no existen usan EnConstruccionComponent: cuando una integrante
 * termina la suya, reemplaza `component` y `data` de SU ruta (una sola línea).
 */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Públicas
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: EnConstruccionComponent, data: { titulo: 'Registrarme' } },
  {
    path: 'recuperar-contrasena',
    component: EnConstruccionComponent,
    data: { titulo: 'Recuperar contraseña' },
  },

  // Paciente
  {
    path: 'paciente',
    canActivate: [rolGuard('PACIENTE')],
    children: [
      { path: 'reservar', component: ReservarTurnoComponent },
      { path: 'mis-turnos', component: MisTurnosComponent },
    ],
  },

  // Administrador
  {
    path: 'admin',
    canActivate: [rolGuard('ADMINISTRADOR')],
    children: [
      { path: 'agenda', component: Agenda },
      { path: 'pacientes', component: EnConstruccionComponent, data: { titulo: 'Pacientes' } },
      {
        path: 'historial',
        component: EnConstruccionComponent,
        data: { titulo: 'Historial clínico' },
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
