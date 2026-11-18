/**
 * Modelos del historial clínico: turno atendido → consulta → diagnósticos → tratamientos.
 * Reflejan los DTOs del backend. Las fechas llegan como "2026-11-20" y las horas como "09:00:00".
 */

/** ConsultaMedicaResponseDTO: una por cada turno ATENDIDO. */
export interface ConsultaMedica {
  id: number;
  idTurno: number;
  fecha: string;
  hora: string;
  observaciones: string | null;
}

/** DiagnosticoResponseDTO */
export interface Diagnostico {
  id: number;
  idConsulta: number;
  descripcion: string;
}

/** Estados del tratamiento (enum EstadoTratamiento del backend). */
export type EstadoTratamiento = 'EN_CURSO' | 'FINALIZADO' | 'SUSPENDIDO';

/** TratamientoResponseDTO */
export interface Tratamiento {
  id: number;
  idDiagnostico: number;
  descripcion: string;
  duracion: string | null;
  estado: EstadoTratamiento;
}

/** Un diagnóstico con sus tratamientos, ya juntos para mostrarlos en pantalla. */
export interface DiagnosticoConTratamientos {
  diagnostico: Diagnostico;
  tratamientos: Tratamiento[];
}