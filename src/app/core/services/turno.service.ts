import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Turno, TurnoCancelacionRequest, TurnoRequest } from '../models/turno.model';

/**
 * Turnos: /api/v1/turnos. El token lo agrega el interceptor y el backend controla que un
 * paciente solo vea, reserve y cancele SUS turnos.
 */
@Injectable({
  providedIn: 'root',
})
export class TurnoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/turnos`;

  /** GET /turnos/mis-turnos (solo PACIENTE): los turnos del paciente logueado. */
  misTurnos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.url}/mis-turnos`);
  }

  /**
   * POST /turnos (201). Errores posibles: 400 (datos inválidos o fecha pasada) y
   * 409 (horario ocupado, médico con bloqueo ese día o cobertura que no es del paciente).
   */
  crear(datos: TurnoRequest): Observable<Turno> {
    return this.http.post<Turno>(this.url, datos);
  }

  /** PUT /turnos/{id}/cancelar. Error posible: 409 (el turno ya estaba cancelado o atendido). */
  cancelar(id: number, datos: TurnoCancelacionRequest): Observable<Turno> {
    return this.http.put<Turno>(`${this.url}/${id}/cancelar`, datos);
  }

  /**
   * GET /medicos/{idMedico}/horarios-disponibles?fecha=yyyy-MM-dd: horarios libres ("09:00", "09:30", ...).
   * Devuelve una lista vacía si el médico no atiende ese día o tiene un bloqueo.
   */
  horariosDisponibles(idMedico: number, fecha: string): Observable<string[]> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<string[]>(`${environment.apiUrl}/medicos/${idMedico}/horarios-disponibles`, {
      params,
    });
  }
}
