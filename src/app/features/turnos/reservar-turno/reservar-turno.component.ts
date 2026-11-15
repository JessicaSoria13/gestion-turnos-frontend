import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { Medico, MedicoService } from '../../../core/services/medico.service';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { TurnoService } from '../../../core/services/turno.service';
import { DiaSemana, Disponibilidad } from '../../../core/models/agenda.model';
import { Cobertura, Paciente, Turno } from '../../../core/models/turno.model';
import { mensajeDeError } from '../../../core/utils/errores';
import { fechaLocal, formatearFecha } from '../fechas';

// Date.getDay(): 0 = domingo, 1 = lunes, ...
const DIAS: DiaSemana[] = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

/**
 * Reservar turno (solo PACIENTE).
 * 1. Al entrar: ficha del paciente (/pacientes/me), médicos, sus coberturas y los financiadores.
 * 2. Elige médico y fecha: se piden los horarios libres y las disponibilidades del médico.
 * 3. Elige horario, cobertura (o particular) y motivo: POST /turnos.
 */
@Component({
  selector: 'app-reservar-turno',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reservar-turno.component.html',
  styleUrl: './reservar-turno.component.css',
})
export class ReservarTurnoComponent implements OnInit {
  private readonly pacienteService = inject(PacienteService);
  private readonly medicoService = inject(MedicoService);
  private readonly disponibilidadService = inject(DisponibilidadService);
  private readonly turnoService = inject(TurnoService);

  readonly hoy = fechaLocal(new Date());
  readonly formatearFecha = formatearFecha;

  // Datos que se cargan al entrar
  paciente = signal<Paciente | null>(null);
  medicos = signal<Medico[]>([]);
  coberturas = signal<Cobertura[]>([]);
  nombreFinanciador = signal<Record<number, string>>({});

  // Lo que elige el paciente
  idMedico: number | null = null;
  fecha = '';
  hora = signal<string>('');
  idCobertura: number | null = null;
  motivo = '';

  // Horarios libres (null = todavía buscando) y franjas del médico elegido
  horarios = signal<string[] | null>(null);
  private disponibilidades: Disponibilidad[] = [];

  cargandoInicio = signal<boolean>(true);
  reservando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  turnoReservado = signal<Turno | null>(null);

  textoBoton = computed(() => {
    if (this.reservando()) {
      return 'Reservando...';
    }
    return this.hora() ? `Reservar turno de las ${this.hora()}` : 'Elegí un horario';
  });

  ngOnInit(): void {
    this.pacienteService
      .obtenerPropio()
      .pipe(
        switchMap((paciente) => {
          this.paciente.set(paciente);
          return forkJoin({
            medicos: this.medicoService.listar(),
            coberturas: this.pacienteService.coberturas(paciente.id),
            financiadores: this.pacienteService.financiadores(),
          });
        }),
      )
      .subscribe({
        next: ({ medicos, coberturas, financiadores }) => {
          const nombres: Record<number, string> = {};
          financiadores.forEach((f) => (nombres[f.id] = f.nombre));
          this.nombreFinanciador.set(nombres);
          this.medicos.set(medicos.filter((m) => m.activo));
          this.coberturas.set(coberturas.filter((c) => c.activo));
          this.cargandoInicio.set(false);
        },
        error: (err: unknown) => {
          this.cargandoInicio.set(false);
          this.mensajeError.set(mensajeDeError(err));
        },
      });
  }

  cambiarMedico(idMedico: number | null): void {
    this.idMedico = idMedico;
    this.reiniciarHorario();
  }

  cambiarFecha(fecha: string): void {
    this.fecha = fecha;
    this.reiniciarHorario();
  }

  /** Al cambiar médico o fecha se borra el horario elegido y se vuelven a pedir los libres. */
  private reiniciarHorario(): void {
    this.hora.set('');
    this.mensajeError.set(null);
    this.turnoReservado.set(null);
    this.buscarHorarios();
  }

  elegirHora(hora: string): void {
    this.hora.set(hora);
  }

  reservar(): void {
    const paciente = this.paciente();
    if (!paciente || !this.idMedico || !this.hora()) {
      return;
    }
    this.mensajeError.set(null);

    // El backend pide el id de la franja semanal (disponibilidad) que contiene ese día y horario
    const disponibilidad = this.buscarDisponibilidad();
    if (!disponibilidad) {
      this.mensajeError.set('No se encontró la disponibilidad del médico para ese horario');
      return;
    }

    this.reservando.set(true);
    this.turnoService
      .crear({
        idPaciente: paciente.id,
        idMedico: this.idMedico,
        idDisponibilidad: disponibilidad.id,
        idCobertura: this.idCobertura,
        fecha: this.fecha,
        hora: this.hora(),
        motivoConsulta: this.motivo.trim() || null,
      })
      .subscribe({
        next: (turno) => {
          this.reservando.set(false);
          this.turnoReservado.set(turno);
          this.hora.set('');
          this.motivo = '';
          // El horario reservado ya no está libre
          this.buscarHorarios();
        },
        error: (err: unknown) => {
          this.reservando.set(false);
          this.mensajeError.set(mensajeDeError(err));
        },
      });
  }

  textoCobertura(c: Cobertura): string {
    const nombre = this.nombreFinanciador()[c.idFinanciador] ?? 'Cobertura';
    return `${nombre} · Plan ${c.plan} · N° ${c.numeroAfiliado}`;
  }

  private buscarHorarios(): void {
    if (!this.idMedico || !this.fecha) {
      this.horarios.set(null);
      return;
    }
    this.horarios.set(null);
    forkJoin({
      libres: this.turnoService.horariosDisponibles(this.idMedico, this.fecha),
      disponibilidades: this.disponibilidadService.listar(this.idMedico),
    }).subscribe({
      next: ({ libres, disponibilidades }) => {
        this.disponibilidades = disponibilidades;
        // Si es hoy, no se ofrecen los horarios que ya pasaron
        const ahora = new Date().toTimeString().slice(0, 5);
        this.horarios.set(this.fecha === this.hoy ? libres.filter((h) => h > ahora) : libres);
      },
      error: (err: unknown) => {
        this.horarios.set([]);
        this.mensajeError.set(mensajeDeError(err));
      },
    });
  }

  private buscarDisponibilidad(): Disponibilidad | undefined {
    const dia = DIAS[new Date(`${this.fecha}T00:00`).getDay()];
    const hora = this.hora();
    return this.disponibilidades.find(
      (d) =>
        d.activo &&
        d.idMedico === this.idMedico &&
        d.diaSemana === dia &&
        d.horaInicio.slice(0, 5) <= hora &&
        hora < d.horaFin.slice(0, 5),
    );
  }
}
