import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MedicoService } from '../../../core/services/medico.service';
import { DisponibilidadService } from '../../../core/services/disponibilidad.service';
import {
  DiaSemana,
  Disponibilidad,
  DisponibilidadRequest,
} from '../../../core/models/agenda.model';
import { mensajeDeError } from '../../../core/utils/errores';

/**
 * Agenda del administrador (/admin/agenda).
 * Parte 1: disponibilidad semanal del médico (listar, cargar, editar y dar de baja).
 * Parte 2 (después): bloqueos.
 */
@Component({
  selector: 'app-agenda',
  imports: [FormsModule],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css',
})
export class Agenda implements OnInit {
  private readonly medicoService = inject(MedicoService);
  private readonly disponibilidadService = inject(DisponibilidadService);

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

  // Formulario: si idEditando tiene un número, se está editando esa franja; si es null, se carga una nueva
  idEditando = signal<number | null>(null);
  diaSemana: DiaSemana = 'LUNES';
  horaInicio = '09:00';
  horaFin = '13:00';
  duracionTurnoMin = 30;

  ngOnInit(): void {
    this.medicoService.listar().subscribe({
      next: (medicos) => {
        if (medicos.length === 0) {
          this.mensajeError.set('No hay ningún médico cargado');
          return;
        }
        this.idMedico.set(medicos[0].id);
        this.cargarDisponibilidades();
      },
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
    });
  }

  cargarDisponibilidades(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;
    this.disponibilidadService.listar(idMedico).subscribe({
      next: (lista) => this.disponibilidades.set(this.ordenar(lista)),
      error: (err) => this.mensajeError.set(mensajeDeError(err)),
    });
  }

  guardar(): void {
    const idMedico = this.idMedico();
    if (idMedico === null) return;
    this.limpiarMensajes();

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
    this.limpiarMensajes();
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
    this.limpiarMensajes();
    this.disponibilidadService.eliminar(d.id).subscribe({
      next: () => {
        this.mensajeExito.set('Franja dada de baja');
        this.cargarDisponibilidades();
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

  private limpiarMensajes(): void {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
  }
}
