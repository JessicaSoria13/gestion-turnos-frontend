import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../models/auth.model';

/**
 * Convierte un error HTTP en un mensaje para mostrar en pantalla.
 * El backend siempre responde con `ErrorResponse` (`mensaje` + `detalles`).
 * Si no hubo respuesta (status 0), el backend está apagado o no se pudo conectar.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor';
    }
    const cuerpo = error.error as Partial<ErrorResponse> | null;
    if (cuerpo?.mensaje) {
      return cuerpo.mensaje;
    }
    return `Error ${error.status}`;
  }
  return 'Ocurrió un error inesperado';
}

/** Detalles de validación del backend (por ejemplo "fechaNacimiento: debe ser una fecha pasada"). */
export function detallesDeError(error: unknown): string[] {
  if (error instanceof HttpErrorResponse) {
    const cuerpo = error.error as Partial<ErrorResponse> | null;
    return cuerpo?.detalles ?? [];
  }
  return [];
}
