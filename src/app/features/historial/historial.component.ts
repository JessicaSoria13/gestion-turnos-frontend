import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { HistorialService } from '../../core/services/historial.service';
import { Paciente, Turno } from '../../core/models/turno.model';
import { ConsultaMedica, DiagnosticoConTratamientos } from '../../core/models/historial.model';
import { mensajeDeError } from '../../core/utils/errores';
import { fechaLocal, formatearFecha } from '../turnos/fechas';

/**
 * Historial clínico (solo ADMINISTRADOR, /admin/historial).
 * 1. Se elige un paciente y se listan sus turnos (GET /pacientes/{id}/turnos).
 * 2. En un turno CONFIRMADO cuya fecha ya llegó, "Registrar atención" crea la consulta
 *    y el turno pasa a ATENDIDO. Un turno futuro no se puede atender todavía
 *    (el backend también lo rechaza con 409).
 * 3. En un turno ATENDIDO, "Ver consulta" muestra la consulta, sus diagnósticos
 *    y los tratamientos de cada diagnóstico, y permite agregar diagnósticos y tratamientos.
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

  // Turno al que se le está registrando la atención (formulario de observaciones)
  turnoEnRegistro = signal<Turno | null>(null);
  observaciones = '';

  // Formularios de alta dentro de la consulta abierta
  nuevoDiagnostico = '';
  idDiagnosticoConFormulario = signal<number | null>(null);
  tratamientoDescripcion = '';
  tratamientoDuracion = '';

  guardando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

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
    this.mensajeExito.set(null);
    this.cerrarConsulta();
    this.turnos.set(null);
    this.refrescarTurnos();
  }

  /** Vuelve a pedir los turnos del paciente sin cerrar lo que está abierto. */
  private refrescarTurnos(): void {
    if (this.idPaciente === null) return;
    this.historialService.turnosDePaciente(this.idPaciente).subscribe({
      next: (lista) => this.turnos.set(lista),
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
    });
  }

  /**
   * Un turno se puede atender si está CONFIRMADO y su fecha es hoy o ya pasó.
   * Las fechas vienen como "2026-11-24", así que se comparan como texto.
   */
  puedeRegistrarAtencion(turno: Turno): boolean {
    return turno.estado === 'CONFIRMADO' && turno.fecha <= fechaLocal(new Date());
  }

  abrirRegistro(turno: Turno): void {
    this.cerrarConsulta();
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.observaciones = '';
    this.turnoEnRegistro.set(turno);
  }

  cancelarRegistro(): void {
    this.turnoEnRegistro.set(null);
  }

  /** POST /consultas-medicas. Si sale bien, el turno queda ATENDIDO y se abre su consulta. */
  registrarAtencion(): void {
    const turno = this.turnoEnRegistro();
    if (turno === null || this.guardando()) return;
    // Doble control: el botón ya no aparece en turnos futuros, pero por las dudas.
    if (!this.puedeRegistrarAtencion(turno)) {
      this.mensajeError.set('No se puede registrar la atención antes de la fecha del turno.');
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set(null);
    const observaciones = this.observaciones.trim() || null;

    this.historialService.registrarConsulta(turno.id, observaciones).subscribe({
      next: () => {
        this.guardando.set(false);
        this.turnoEnRegistro.set(null);
        this.refrescarTurnos();
        this.verConsulta({ ...turno, estado: 'ATENDIDO' });
        this.mensajeExito.set('Atención registrada. Ahora podés cargar los diagnósticos.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError.set(mensajeDeError(err));
      },
    });
  }

  /** POST /diagnosticos sobre la consulta abierta. */
  agregarDiagnostico(): void {
    const consulta = this.consulta();
    const descripcion = this.nuevoDiagnostico.trim();
    if (consulta === null || descripcion === '' || this.guardando()) return;

    this.guardando.set(true);
    this.mensajeError.set(null);
    this.historialService.agregarDiagnostico(consulta.id, descripcion).subscribe({
      next: () => {
        this.guardando.set(false);
        this.nuevoDiagnostico = '';
        this.recargarConsulta('Diagnóstico agregado.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError.set(mensajeDeError(err));
      },
    });
  }

  abrirFormularioTratamiento(idDiagnostico: number): void {
    this.tratamientoDescripcion = '';
    this.tratamientoDuracion = '';
    this.idDiagnosticoConFormulario.set(idDiagnostico);
  }

  cerrarFormularioTratamiento(): void {
    this.idDiagnosticoConFormulario.set(null);
  }

  /** POST /tratamientos sobre el diagnóstico que tiene el formulario abierto. */
  agregarTratamiento(): void {
    const idDiagnostico = this.idDiagnosticoConFormulario();
    const descripcion = this.tratamientoDescripcion.trim();
    if (idDiagnostico === null || descripcion === '' || this.guardando()) return;

    this.guardando.set(true);
    this.mensajeError.set(null);
    const duracion = this.tratamientoDuracion.trim() || null;
    this.historialService.agregarTratamiento(idDiagnostico, descripcion, duracion).subscribe({
      next: () => {
        this.guardando.set(false);
        this.idDiagnosticoConFormulario.set(null);
        this.recargarConsulta('Tratamiento agregado.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.mensajeError.set(mensajeDeError(err));
      },
    });
  }

  /** Vuelve a cargar la consulta abierta para mostrar lo recién agregado. */
  private recargarConsulta(mensaje: string): void {
    const turno = this.turnoAbierto();
    if (turno === null) return;
    this.verConsulta(turno);
    this.mensajeExito.set(mensaje);
  }

  verConsulta(turno: Turno): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.turnoEnRegistro.set(null);
    this.idDiagnosticoConFormulario.set(null);
    this.nuevoDiagnostico = '';
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
