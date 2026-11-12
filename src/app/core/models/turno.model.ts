/**
 * Modelos de Turnos y de los datos del paciente que se usan para reservar.
 * Reflejan los DTOs del backend (paquete com.turnosmedicos.backend.dto).
 * Las fechas llegan como "2026-11-20" y las horas como "09:00:00".
 */

/** Estados del turno (enum EstadoTurno del backend). */
export type EstadoTurno = 'CONFIRMADO' | 'CANCELADO' | 'ATENDIDO';

/** TurnoResponseDTO */
export interface Turno {
  id: number;
  idPaciente: number;
  idMedico: number;
  idDisponibilidad: number;
  idCobertura: number | null;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  motivoConsulta: string | null;
  motivoCancelacion: string | null;
}

/** TurnoRequestDTO: `idCobertura` null = particular. `hora` en formato "HH:mm". */
export interface TurnoRequest {
  idPaciente: number;
  idMedico: number;
  idDisponibilidad: number;
  idCobertura: number | null;
  fecha: string;
  hora: string;
  motivoConsulta: string | null;
}

/** TurnoCancelacionRequestDTO: el backend decide por el rol del token si cancela el paciente o el médico. */
export interface TurnoCancelacionRequest {
  motivoCancelacion: string | null;
}

/** PacienteResponseDTO */
export interface Paciente {
  id: number;
  idUsuario: number;
  nombreApellido: string;
  dni: string;
  fechaNacimiento: string;
  email: string | null;
  celular: string | null;
  domicilio: string | null;
  activo: boolean;
}

/** CoberturaResponseDTO: la obra social o prepaga de un paciente. */
export interface Cobertura {
  id: number;
  idPaciente: number;
  idFinanciador: number;
  numeroAfiliado: string;
  plan: string;
  activo: boolean;
}

/** FinanciadorResponseDTO: la obra social o prepaga (OSDE, PAMI, ...). */
export interface Financiador {
  id: number;
  nombre: string;
  cuit: string;
  activo: boolean;
}
