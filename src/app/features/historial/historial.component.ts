import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { HistorialService } from '../../core/services/historial.service';
import { ToastService } from '../../core/services/toast.service';
import { Paciente, Turno } from '../../core/models/turno.model';
import { ConsultaMedica, DiagnosticoConTratamientos } from '../../core/models/historial.model';
import { mensajeDeError } from '../../core/utils/errores';
import { llevarA } from '../../core/utils/scroll';
import { fechaLocal, formatearFecha } from '../turnos/fechas';

/**
 * Historial clínico (solo ADMINISTRADOR, /admin/historial).
 * 1. Se elige un paciente y se listan sus turnos (GET /pacientes/{id}/turnos).
 * 2. En un turno CONFIRMADO cuya fecha ya llegó, "Registrar atención" crea la consulta
 *    y el turno pasa a ATENDIDO. Un turno futuro no se puede atender todavía
 *    (el backend también lo rechaza con 409).
 * 3. En un turno ATENDIDO, "Ver consulta" muestra la consulta, sus diagnósticos
 *    y los tratamientos de cada diagnóstico, y permite agregar diagnósticos y tratamientos.
 * Desde "Turnos del día" se llega con ?paciente=…&turno=…: se elige ese paciente y se abre el turno.
 * Los resultados de cada acción se avisan con toasts y la pantalla baja sola al panel que se abre.
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
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

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

  ngOnInit(): void {
    // Si se llegó desde "Turnos del día", viene el paciente y el turno a abrir
    const parametros = this.route.snapshot.queryParamMap;
    const idPacienteInicial = Number(parametros.get('paciente')) || null;
    const idTurnoInicial = Number(parametros.get('turno')) || null;

    this.historialService.listarPacientes().subscribe({
      next: (lista) => {
        this.pacientes.set(
          [...lista].sort((a, b) => a.nombreApellido.localeCompare(b.nombreApellido)),
        );
        if (idPacienteInicial !== null && lista.some((p) => p.id === idPacienteInicial)) {
          this.idPaciente = idPacienteInicial;
          this.turnos.set(null);
          this.refrescarTurnos((turnos) => {
            const turno = turnos.find((t) => t.id === idTurnoInicial);
            if (turno) this.abrirTurno(turno);
          });
        }
      },
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  /** Se llama cuando cambia el desplegable de paciente. */
  cargarTurnos(): void {
    this.cerrarConsulta();
    this.turnoEnRegistro.set(null);
    this.turnos.set(null);
    this.refrescarTurnos();
  }

  /** Vuelve a pedir los turnos del paciente sin cerrar lo que está abierto. */
  private refrescarTurnos(alTerminar?: (turnos: Turno[]) => void): void {
    if (this.idPaciente === null) return;
    this.historialService.turnosDePaciente(this.idPaciente).subscribe({
      next: (lista) => {
        this.turnos.set(lista);
        alTerminar?.(lista);
      },
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  /** Abre el panel que corresponde al estado del turno (registrar o ver la consulta). */
  private abrirTurno(turno: Turno): void {
    if (turno.estado === 'ATENDIDO') {
      this.verConsulta(turno);
    } else if (this.puedeRegistrarAtencion(turno)) {
      this.abrirRegistro(turno);
    }
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
    this.observaciones = '';
    this.turnoEnRegistro.set(turno);
    llevarA('panel-atencion');
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
      this.toast.error('No se puede registrar la atención antes de la fecha del turno.');
      return;
    }

    this.guardando.set(true);
    const observaciones = this.observaciones.trim() || null;

    this.historialService.registrarConsulta(turno.id, observaciones).subscribe({
      next: () => {
        this.guardando.set(false);
        this.turnoEnRegistro.set(null);
        this.refrescarTurnos();
        this.verConsulta({ ...turno, estado: 'ATENDIDO' });
        this.toast.exito('Atención registrada. Ahora podés cargar los diagnósticos.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.toast.error(mensajeDeError(err));
        // Ej.: 409 "ya tiene una consulta": se actualiza la tabla para mostrar el estado real
        this.refrescarTurnos();
      },
    });
  }

  /** POST /diagnosticos sobre la consulta abierta. */
  agregarDiagnostico(): void {
    const consulta = this.consulta();
    const descripcion = this.nuevoDiagnostico.trim();
    if (consulta === null || descripcion === '' || this.guardando()) return;

    this.guardando.set(true);
    this.historialService.agregarDiagnostico(consulta.id, descripcion).subscribe({
      next: () => {
        this.guardando.set(false);
        this.nuevoDiagnostico = '';
        this.recargarConsulta();
        this.toast.exito('Diagnóstico agregado.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.toast.error(mensajeDeError(err));
      },
    });
  }

  abrirFormularioTratamiento(idDiagnostico: number): void {
    this.tratamientoDescripcion = '';
    this.tratamientoDuracion = '';
    this.idDiagnosticoConFormulario.set(idDiagnostico);
    llevarA(`form-tratamiento-${idDiagnostico}`);
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
    const duracion = this.tratamientoDuracion.trim() || null;
    this.historialService.agregarTratamiento(idDiagnostico, descripcion, duracion).subscribe({
      next: () => {
        this.guardando.set(false);
        this.idDiagnosticoConFormulario.set(null);
        this.recargarConsulta();
        this.toast.exito('Tratamiento agregado.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.toast.error(mensajeDeError(err));
      },
    });
  }

  /** Vuelve a cargar la consulta abierta para mostrar lo recién agregado, sin mover la pantalla. */
  private recargarConsulta(): void {
    const turno = this.turnoAbierto();
    if (turno === null) return;
    this.verConsulta(turno, false);
  }

  /**
   * Abre la consulta del turno: la consulta, sus diagnósticos y los tratamientos de cada uno.
   * Con desdeCero = false (después de agregar algo) no muestra "Cargando..." ni mueve la pantalla.
   */
  verConsulta(turno: Turno, desdeCero = true): void {
    this.turnoEnRegistro.set(null);
    this.idDiagnosticoConFormulario.set(null);
    this.turnoAbierto.set(turno);
    if (desdeCero) {
      this.nuevoDiagnostico = '';
      this.consulta.set(null);
      this.diagnosticos.set([]);
      this.cargandoConsulta.set(true);
      llevarA('panel-consulta');
    }

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
          this.toast.error(mensajeDeError(err));
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
