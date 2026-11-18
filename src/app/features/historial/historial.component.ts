import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { HistorialService } from '../../core/services/historial.service';
import { Paciente, Turno } from '../../core/models/turno.model';
import { ConsultaMedica, DiagnosticoConTratamientos } from '../../core/models/historial.model';
import { mensajeDeError } from '../../core/utils/errores';
import { formatearFecha } from '../turnos/fechas';

/**
 * Historial clínico (solo ADMINISTRADOR, /admin/historial), en modo consulta.
 * 1. Se elige un paciente y se listan sus turnos (GET /pacientes/{id}/turnos).
 * 2. En un turno ATENDIDO, "Ver consulta" muestra la consulta, sus diagnósticos
 *    y los tratamientos de cada diagnóstico.
 */
@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css',
})
export class HistorialComponent implements OnInit {
  private readonly historialService = inject(HistorialService);

  readonly formatearFecha = formatearFecha;

  pacientes = signal<Paciente[]>([]);
  idPaciente: number | null = null;

  // null = todavía no se eligió paciente
  turnos = signal<Turno[] | null>(null);

  // Turno abierto y lo que se encontró de él
  turnoAbierto = signal<Turno | null>(null);
  consulta = signal<ConsultaMedica | null>(null);
  diagnosticos = signal<DiagnosticoConTratamientos[]>([]);
  cargandoConsulta = signal<boolean>(false);

  mensajeError = signal<string | null>(null);

  ngOnInit(): void {
    this.historialService.listarPacientes().subscribe({
      next: (lista) =>
        this.pacientes.set(
          [...lista].sort((a, b) => a.nombreApellido.localeCompare(b.nombreApellido)),
        ),
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
    });
  }

  /** Se llama cuando cambia el desplegable de paciente. */
  cargarTurnos(): void {
    this.mensajeError.set(null);
    this.cerrarConsulta();
    this.turnos.set(null);
    if (this.idPaciente === null) return;

    this.historialService.turnosDePaciente(this.idPaciente).subscribe({
      next: (lista) => this.turnos.set(lista),
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
    });
  }

  verConsulta(turno: Turno): void {
    this.mensajeError.set(null);
    this.turnoAbierto.set(turno);
    this.consulta.set(null);
    this.diagnosticos.set([]);
    this.cargandoConsulta.set(true);

    this.historialService
      .consultas()
      .pipe(
        // 1. De todas las consultas, la de este turno
        map((consultas) => consultas.find((c) => c.idTurno === turno.id) ?? null),
        switchMap((consulta) => {
          this.consulta.set(consulta);
          if (consulta === null) return of([]);
          // 2. Los diagnósticos de esa consulta
          return this.historialService.diagnosticosDeConsulta(consulta.id).pipe(
            switchMap((diagnosticos) => {
              if (diagnosticos.length === 0) return of([]);
              // 3. Los tratamientos de cada diagnóstico, todos a la vez
              return forkJoin(
                diagnosticos.map((diagnostico) =>
                  this.historialService
                    .tratamientosDeDiagnostico(diagnostico.id)
                    .pipe(map((tratamientos) => ({ diagnostico, tratamientos }))),
                ),
              );
            }),
          );
        }),
      )
      .subscribe({
        next: (lista) => {
          this.diagnosticos.set(lista);
          this.cargandoConsulta.set(false);
        },
        error: (err) => {
          this.mensajeError.set(mensajeDeError(err));
          this.cargandoConsulta.set(false);
        },
      });
  }

  cerrarConsulta(): void {
    this.turnoAbierto.set(null);
    this.consulta.set(null);
    this.diagnosticos.set([]);
  }

  /** "EN_CURSO" → "En curso" */
  textoEstado(estado: string): string {
    const texto = estado.replace('_', ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}