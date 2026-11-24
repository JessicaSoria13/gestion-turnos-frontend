import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TurnoService } from '../../core/services/turno.service';
import { PacienteService } from '../../core/services/paciente.service';
import { ToastService } from '../../core/services/toast.service';
import { Paciente, Turno } from '../../core/models/turno.model';
import { mensajeDeError } from '../../core/utils/errores';
import { llevarA } from '../../core/utils/scroll';
import { CampoFecha } from '../../shared/campo-fecha/campo-fecha';
import { fechaLocal, formatearFecha } from '../turnos/fechas';

/**
 * Turnos del día (solo ADMINISTRADOR, /admin/turnos): la agenda del consultorio para una fecha.
 * - Muestra los turnos de la fecha elegida (hoy por defecto), ordenados por hora, con el paciente.
 * - "Registrar atención" (turno CONFIRMADO de hoy o anterior) y "Ver consulta" (ATENDIDO) llevan al
 *   historial clínico de ese paciente con el turno abierto.
 * - "Cancelar" (turno CONFIRMADO de hoy en adelante): el médico cancela con motivo obligatorio
 *   (PUT /turnos/{id}/cancelar) y el horario vuelve a quedar libre.
 * El backend devuelve todos los turnos (GET /turnos); el filtro por fecha se hace acá.
 */
@Component({
  selector: 'app-turnos-del-dia',
  standalone: true,
  imports: [FormsModule, CampoFecha],
  templateUrl: './turnos-del-dia.component.html',
  styleUrl: './turnos-del-dia.component.css',
})
export class TurnosDelDiaComponent implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly pacienteService = inject(PacienteService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly hoy = fechaLocal(new Date());
  readonly formatearFecha = formatearFecha;

  // Fecha que se está mirando (signal, para que la lista se recalcule sola al cambiarla)
  fecha = signal<string>(this.hoy);

  // null = todavía cargando
  todos = signal<Turno[] | null>(null);
  pacientes = signal<Record<number, Paciente>>({});

  // Turno que se está por cancelar (muestra el cuadro del motivo) y el motivo escrito
  idCancelando = signal<number | null>(null);
  motivoCancelacion = '';
  cancelando = signal<boolean>(false);

  /** Los turnos de la fecha elegida, ordenados por hora. */
  readonly turnosDelDia = computed(() =>
    (this.todos() ?? [])
      .filter((t) => t.fecha === this.fecha())
      .sort((a, b) => a.hora.localeCompare(b.hora)),
  );

  /** Ej.: "5 turnos · 3 confirmados · 1 atendido · 1 cancelado" */
  readonly resumen = computed(() => {
    const lista = this.turnosDelDia();
    const contar = (estado: string) => lista.filter((t) => t.estado === estado).length;
    const plural = (n: number, singular: string, varios: string) =>
      `${n} ${n === 1 ? singular : varios}`;
    return [
      plural(lista.length, 'turno', 'turnos'),
      plural(contar('CONFIRMADO'), 'confirmado', 'confirmados'),
      plural(contar('ATENDIDO'), 'atendido', 'atendidos'),
      plural(contar('CANCELADO'), 'cancelado', 'cancelados'),
    ].join(' · ');
  });

  readonly titulo = computed(() =>
    this.fecha() === this.hoy ? 'Turnos de hoy' : `Turnos del ${formatearFecha(this.fecha())}`,
  );

  ngOnInit(): void {
    this.cargar();
  }

  cambiarFecha(fecha: string): void {
    if (!fecha) return;
    this.idCancelando.set(null);
    this.fecha.set(fecha);
  }

  /** Día anterior (-1) o siguiente (+1). */
  moverDia(dias: number): void {
    const fecha = new Date(`${this.fecha()}T00:00`);
    fecha.setDate(fecha.getDate() + dias);
    this.cambiarFecha(fechaLocal(fecha));
  }

  irAHoy(): void {
    this.cambiarFecha(this.hoy);
  }

  nombrePaciente(turno: Turno): string {
    return this.pacientes()[turno.idPaciente]?.nombreApellido ?? `Paciente ${turno.idPaciente}`;
  }

  dniPaciente(turno: Turno): string | null {
    return this.pacientes()[turno.idPaciente]?.dni ?? null;
  }

  /** Igual que en el historial: CONFIRMADO y con fecha de hoy o anterior. */
  puedeAtender(turno: Turno): boolean {
    return turno.estado === 'CONFIRMADO' && turno.fecha <= this.hoy;
  }

  /** Igual que en "Mis turnos": solo los CONFIRMADOS de hoy en adelante. */
  puedeCancelar(turno: Turno): boolean {
    return turno.estado === 'CONFIRMADO' && turno.fecha >= this.hoy;
  }

  /** Abre el historial clínico del paciente con este turno listo para atender o para ver. */
  irAlHistorial(turno: Turno): void {
    this.router.navigate(['/admin/historial'], {
      queryParams: { paciente: turno.idPaciente, turno: turno.id },
    });
  }

  pedirCancelacion(turno: Turno): void {
    this.motivoCancelacion = '';
    this.idCancelando.set(turno.id);
    llevarA(`cancelar-${turno.id}`);
  }

  volver(): void {
    this.idCancelando.set(null);
  }

  confirmarCancelacion(turno: Turno): void {
    const motivo = this.motivoCancelacion.trim();
    if (motivo === '') {
      this.toast.error('Escribí el motivo: cuando cancela el médico es obligatorio.');
      return;
    }
    this.cancelando.set(true);
    this.turnoService.cancelar(turno.id, { motivoCancelacion: motivo }).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.idCancelando.set(null);
        this.toast.exito(
          `Turno de ${this.nombrePaciente(turno)} a las ${turno.hora.slice(0, 5)} cancelado. ` +
            'El horario vuelve a estar disponible.',
        );
        this.cargar();
      },
      error: (err: unknown) => {
        this.cancelando.set(false);
        this.toast.error(mensajeDeError(err));
      },
    });
  }

  private cargar(): void {
    forkJoin({
      turnos: this.turnoService.listar(),
      pacientes: this.pacienteService.listar(),
    }).subscribe({
      next: ({ turnos, pacientes }) => {
        const porId: Record<number, Paciente> = {};
        pacientes.forEach((p) => (porId[p.id] = p));
        this.pacientes.set(porId);
        this.todos.set(turnos);
      },
      error: (err: unknown) => {
        this.todos.set([]);
        this.toast.error(mensajeDeError(err));
      },
    });
  }
}
