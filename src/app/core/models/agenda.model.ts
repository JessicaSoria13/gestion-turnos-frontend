/** Días de la semana tal como los define el enum DiaSemana del backend. */
export type DiaSemana =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

/** Lo que devuelve el backend (DisponibilidadResponseDTO). Las horas llegan como "09:00:00". */
export interface Disponibilidad {
  id: number;
  idMedico: number;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  duracionTurnoMin: number;
  activo: boolean;
}

/** Lo que se manda al crear o editar (DisponibilidadRequestDTO). */
export interface DisponibilidadRequest {
  idMedico: number;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  duracionTurnoMin: number;
}

/** Lo que devuelve el backend (BloqueoResponseDTO). Las fechas llegan como "2026-11-20". */
export interface Bloqueo {
  id: number;
  idMedico: number;
  fechaDesde: string;
  fechaHasta: string;
  motivo: string;
  activo: boolean;
}

/** Lo que se manda al crear un bloqueo (BloqueoRequestDTO). El motivo es obligatorio, máximo 100 caracteres. */
export interface BloqueoRequest {
  idMedico: number;
  fechaDesde: string;
  fechaHasta: string;
  motivo: string;
}
