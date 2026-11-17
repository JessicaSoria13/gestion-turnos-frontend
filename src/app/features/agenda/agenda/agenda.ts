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
import { mensajeDeError } from '../../../core/utils/errores';
import { fechaLocal, formatearFecha } from '../../turnos/fechas';
import { CampoFecha } from '../../../shared/campo-fecha/campo-fecha';

/** Dónde se muestran los mensajes: arriba (carga general) o junto a la sección que se está usando. */
type SeccionMensaje = 'general' | 'disponibilidad' | 'bloqueos';

/**
 * Agenda del administrador (/admin/agenda).
 * Parte 1: disponibilidad semanal del médico (listar, cargar, editar y dar de baja).
 * Parte 2: bloqueos de fechas (vacaciones, feriados, licencias): listar, cargar y dar de baja.
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
  mensajeError = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  seccionMensaje = signal<SeccionMensaje>('general');

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
          this.mensajeError.set('No hay ningún médico cargado');
          return;
        }
        this.idMedico.set(medicos[0].id);
        this.cargarDisponibilidades();
        this.cargarBloqueos();
      },
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
    });
  }

  cargarDisponibilidades(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;
    this.disponibilidadService.listar(idMedico).subscribe({
      next: (lista) => this.disponibilidades.set(this.ordenar(lista)),
      error: (err) => this.mostrarError('disponibilidad', mensajeDeError(err)),
    });
  }

  guardar(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;
    this.limpiarMensajes('disponibilidad');

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
        this.mensajeExito.set(id === null ? 'Franja cargada' : 'Franja actualizada');
        this.cancelarEdicion();
        this.cargarDisponibilidades();
      },
      // Ej.: 409 "El médico ya tiene una disponibilidad que se solapa con ese horario"
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
    });
  }

  editar(d: Disponibilidad): void {
    this.limpiarMensajes('disponibilidad');
    this.idEditando.set(d.id);
    this.diaSemana = d.diaSemana;
    // El backend devuelve "09:00:00"; el input de hora usa "09:00"
    this.horaInicio = d.horaInicio.slice(0, 5);
    this.horaFin = d.horaFin.slice(0, 5);
    this.duracionTurnoMin = d.duracionTurnoMin;
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
    this.limpiarMensajes('disponibilidad');
    this.disponibilidadService.eliminar(d.id).subscribe({
      next: () => {
        this.mensajeExito.set('Franja dada de baja');
        this.cargarDisponibilidades();
      },
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
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
      error: (err) => this.mostrarError('bloqueos', mensajeDeError(err)),
    });
  }

  guardarBloqueo(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;
    this.limpiarMensajes('bloqueos');

    if (this.fechaHasta < this.fechaDesde) {
      this.mensajeError.set('La fecha "hasta" no puede ser anterior a la fecha "desde"');
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
          this.mensajeExito.set(
            'Bloqueo cargado. Los turnos confirmados de esas fechas se cancelaron.',
          );
          this.fechaDesde = this.hoy;
          this.fechaHasta = this.hoy;
          this.motivoBloqueo = '';
          this.cargarBloqueos();
        },
        error: (err) => this.mensajeError.set(mensajeDeError(err)),
      });
  }

  darDeBajaBloqueo(b: Bloqueo): void {
    const texto = `¿Quitar el bloqueo "${b.motivo}"? Esas fechas vuelven a estar libres, pero los turnos cancelados no se recuperan.`;
    if (!confirm(texto)) return;
    this.limpiarMensajes('bloqueos');
    this.bloqueoService.eliminar(b.id).subscribe({
      next: () => {
        this.mensajeExito.set('Bloqueo dado de baja');
        this.cargarBloqueos();
      },
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
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

  /** Borra los mensajes anteriores y deja anotado en qué sección se van a mostrar los nuevos. */
  private limpiarMensajes(seccion: SeccionMensaje): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    this.seccionMensaje.set(seccion);
  }

  private mostrarError(seccion: SeccionMensaje, mensaje: string): void {
    this.seccionMensaje.set(seccion);
    this.mensajeError.set(mensaje);
  }
}