import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { EnConstruccionComponent } from './features/en-construccion/en-construccion.component';
import { rolGuard } from './core/guards/auth.guard';

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
      { path: 'reservar', component: EnConstruccionComponent, data: { titulo: 'Reservar turno' } },
      { path: 'mis-turnos', component: EnConstruccionComponent, data: { titulo: 'Mis turnos' } },
    ],
  },

  // Administrador
  {
    path: 'admin',
    canActivate: [rolGuard('ADMINISTRADOR')],
    children: [
      { path: 'agenda', component: EnConstruccionComponent, data: { titulo: 'Agenda' } },
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
