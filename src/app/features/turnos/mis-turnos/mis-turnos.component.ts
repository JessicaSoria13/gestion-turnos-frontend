import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MedicoService } from '../../../core/services/medico.service';
import { TurnoService } from '../../../core/services/turno.service';
import { Turno } from '../../../core/models/turno.model';
import { mensajeDeError } from '../../../core/utils/errores';
import { fechaLocal, formatearFecha } from '../fechas';

/**
 * Mis turnos (solo PACIENTE): GET /turnos/mis-turnos.
 * Los turnos CONFIRMADOS de hoy en adelante se pueden cancelar (PUT /turnos/{id}/cancelar)
 * con un motivo opcional; el horario vuelve a quedar libre.
 */
@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css',
})
export class MisTurnosComponent implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly medicoService = inject(MedicoService);

  readonly hoy = fechaLocal(new Date());
  readonly formatearFecha = formatearFecha;

  // null = todavía cargando
  turnos = signal<Turno[] | null>(null);
  nombreMedico = signal<Record<number, string>>({});

  // Turno que se está por cancelar (muestra el cuadro del motivo) y el motivo escrito
  idCancelando = signal<number | null>(null);
  motivoCancelacion = '';
  cancelando = signal<boolean>(false);

  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  /** Solo se pueden cancelar los turnos confirmados de hoy en adelante. */
  sePuedeCancelar(turno: Turno): boolean {
    return turno.estado === 'CONFIRMADO' && turno.fecha >= this.hoy;
  }

  pedirCancelacion(turno: Turno): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.motivoCancelacion = '';
    this.idCancelando.set(turno.id);
  }

  volver(): void {
    this.idCancelando.set(null);
  }

  confirmarCancelacion(turno: Turno): void {
    this.cancelando.set(true);
    this.turnoService
      .cancelar(turno.id, { motivoCancelacion: this.motivoCancelacion.trim() || null })
      .subscribe({
        next: () => {
          this.cancelando.set(false);
          this.idCancelando.set(null);
          this.mensajeExito.set(
            `Turno del ${formatearFecha(turno.fecha)} a las ${turno.hora.slice(0, 5)} cancelado. ` +
              'El horario vuelve a estar disponible.',
          );
          this.cargar();
        },
        error: (err: unknown) => {
          this.cancelando.set(false);
          this.mensajeError.set(mensajeDeError(err));
        },
      });
  }

  private cargar(): void {
    forkJoin({
      turnos: this.turnoService.misTurnos(),
      medicos: this.medicoService.listar(),
    }).subscribe({
      next: ({ turnos, medicos }) => {
        const nombres: Record<number, string> = {};
        medicos.forEach((m) => (nombres[m.id] = m.nombre));
        this.nombreMedico.set(nombres);
        // Ordenados por fecha y hora, del más lejano al más viejo
        this.turnos.set(
          [...turnos].sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)),
        );
      },
      error: (err: unknown) => {
        this.turnos.set([]);
        this.mensajeError.set(mensajeDeError(err));
      },
    });
  }
}
