import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MedicoService } from '../../../core/services/medico.service';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';
import { BloqueoService } from '../../../core/services/bloqueo.service';
import {
  Bloqueo,
  DiaSemana,
  Disponibilidad,
  DisponibilidadRequest,
} from '../../../core/models/agenda.model';
import { ToastService } from '../../../core/services/toast.service';
import { mensajeDeError } from '../../../core/utils/errores';
import { llevarA } from '../../../core/utils/scroll';
import { fechaLocal, formatearFecha } from '../../turnos/fechas';
import { CampoFecha } from '../../../shared/campo-fecha/campo-fecha';

/**
 * Agenda del administrador (/admin/agenda).
 * Parte 1: disponibilidad semanal del médico (listar, cargar, editar y dar de baja).
 * Parte 2: bloqueos de fechas (vacaciones, feriados, licencias): listar, cargar y dar de baja.
 * Los resultados se avisan con toasts; al tocar "Editar" la pantalla baja sola al formulario.
 */
@Component({
  selector: 'app-agenda',
  imports: [FormsModule, CampoFecha],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css',
})
export class Agenda implements OnInit {
  private readonly medicoService = inject(MedicoService);
  private readonly disponibilidadService = inject(DisponibilidadService);
  private readonly bloqueoService = inject(BloqueoService);
  private readonly toast = inject(ToastService);

  readonly dias: DiaSemana[] = [
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO',
  ];

  // Id del médico: la versión inicial tiene uno solo, se toma el primero que devuelve el backend
  idMedico = signal<number | null>(null);

  disponibilidades = signal<Disponibilidad[]>([]);

  // Formulario: si idEditando tiene un número, se está editando esa franja; si es null, se carga una nueva
  idEditando = signal<number | null>(null);
  diaSemana: DiaSemana = 'LUNES';
  horaInicio = '09:00';
  horaFin = '13:00';
  duracionTurnoMin = 30;

  // Parte 2: bloqueos
  readonly hoy = fechaLocal(new Date());
  readonly formatearFecha = formatearFecha;
  bloqueos = signal<Bloqueo[]>([]);
  fechaDesde = this.hoy;
  fechaHasta = this.hoy;
  motivoBloqueo = '';

  ngOnInit(): void {
    this.medicoService.listar().subscribe({
      next: (medicos) => {
        if (medicos.length === 0) {
          this.toast.error('No hay ningún médico cargado');
          return;
        }
        this.idMedico.set(medicos[0].id);
        this.cargarDisponibilidades();
        this.cargarBloqueos();
      },
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  cargarDisponibilidades(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;
    this.disponibilidadService.listar(idMedico).subscribe({
      next: (lista) => this.disponibilidades.set(this.ordenar(lista)),
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  guardar(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;

    const datos: DisponibilidadRequest = {
      idMedico,
      diaSemana: this.diaSemana,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      duracionTurnoMin: this.duracionTurnoMin,
    };

    const id = this.idEditando();
    const pedido =
      id === null
        ? this.disponibilidadService.crear(datos)
        : this.disponibilidadService.actualizar(id, datos);

    pedido.subscribe({
      next: () => {
        this.toast.exito(id === null ? 'Franja cargada' : 'Franja actualizada');
        this.cancelarEdicion();
        this.cargarDisponibilidades();
      },
      // Ej.: 409 "El médico ya tiene una disponibilidad que se solapa con ese horario"
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  editar(d: Disponibilidad): void {
    this.idEditando.set(d.id);
    this.diaSemana = d.diaSemana;
    // El backend devuelve "09:00:00"; el input de hora usa "09:00"
    this.horaInicio = d.horaInicio.slice(0, 5);
    this.horaFin = d.horaFin.slice(0, 5);
    this.duracionTurnoMin = d.duracionTurnoMin;
    // El formulario está debajo de la tabla: se lleva la pantalla hasta ahí
    llevarA('form-franja');
  }

  cancelarEdicion(): void {
    this.idEditando.set(null);
    this.diaSemana = 'LUNES';
    this.horaInicio = '09:00';
    this.horaFin = '13:00';
    this.duracionTurnoMin = 30;
  }

  darDeBaja(d: Disponibilidad): void {
    const texto = `¿Dar de baja la franja del ${d.diaSemana} de ${this.hora(d.horaInicio)} a ${this.hora(d.horaFin)}?`;
    if (!confirm(texto)) return;
    this.disponibilidadService.eliminar(d.id).subscribe({
      next: () => {
        this.toast.exito('Franja dada de baja');
        this.cargarDisponibilidades();
      },
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  // ---------- Parte 2: bloqueos ----------

  cargarBloqueos(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;
    this.bloqueoService.listar(idMedico).subscribe({
      // Del más próximo al más lejano
      next: (lista) =>
        this.bloqueos.set([...lista].sort((a, b) => a.fechaDesde.localeCompare(b.fechaDesde))),
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  guardarBloqueo(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;

    if (this.fechaHasta < this.fechaDesde) {
      this.toast.error('La fecha "hasta" no puede ser anterior a la fecha "desde"');
      return;
    }

    // Al bloquear, el backend cancela los turnos CONFIRMADOS de esas fechas: se avisa antes
    const rango =
      this.fechaDesde === this.fechaHasta
        ? `el ${formatearFecha(this.fechaDesde)}`
        : `del ${formatearFecha(this.fechaDesde)} al ${formatearFecha(this.fechaHasta)}`;
    if (
      !confirm(`¿Bloquear la agenda ${rango}? Se cancelan los turnos confirmados de esas fechas.`)
    ) {
      return;
    }

    this.bloqueoService
      .crear({
        idMedico,
        fechaDesde: this.fechaDesde,
        fechaHasta: this.fechaHasta,
        motivo: this.motivoBloqueo.trim(),
      })
      .subscribe({
        next: () => {
          this.toast.exito(
            'Bloqueo cargado. Los turnos confirmados de esas fechas se cancelaron.',
          );
          this.fechaDesde = this.hoy;
          this.fechaHasta = this.hoy;
          this.motivoBloqueo = '';
          this.cargarBloqueos();
        },
        error: (err) => this.toast.error(mensajeDeError(err)),
      });
  }

  darDeBajaBloqueo(b: Bloqueo): void {
    const texto = `¿Quitar el bloqueo "${b.motivo}"? Esas fechas vuelven a estar libres, pero los turnos cancelados no se recuperan.`;
    if (!confirm(texto)) return;
    this.bloqueoService.eliminar(b.id).subscribe({
      next: () => {
        this.toast.exito('Bloqueo dado de baja');
        this.cargarBloqueos();
      },
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  /** "09:00:00" → "09:00" para mostrar en la tabla. */
  hora(valor: string): string {
    return valor.slice(0, 5);
  }

  private ordenar(lista: Disponibilidad[]): Disponibilidad[] {
    return [...lista].sort(
      (a, b) =>
        this.dias.indexOf(a.diaSemana) - this.dias.indexOf(b.diaSemana) ||
        a.horaInicio.localeCompare(b.horaInicio),
    );
  }
}