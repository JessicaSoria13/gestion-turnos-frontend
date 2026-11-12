import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bloqueo, BloqueoRequest } from '../models/agenda.model';

/**
 * Bloqueos de la agenda (vacaciones, feriados, licencias): /api/v1/bloqueos. Solo ADMINISTRADOR.
 * Al crear un bloqueo, el backend cancela los turnos CONFIRMADOS de esas fechas.
 * Al darlo de baja, los horarios vuelven a estar libres pero esos turnos NO se restauran.
 */
@Injectable({
  providedIn: 'root',
})
export class BloqueoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/bloqueos`;

  /** GET /bloqueos?idMedico= : los bloqueos activos de un médico. */
  listar(idMedico: number): Observable<Bloqueo[]> {
    const params = new HttpParams().set('idMedico', idMedico);
    return this.http.get<Bloqueo[]>(this.url, { params });
  }

  /** POST /bloqueos. Cancela los turnos confirmados del rango. */
  crear(datos: BloqueoRequest): Observable<Bloqueo> {
    return this.http.post<Bloqueo>(this.url, datos);
  }

  /** DELETE /bloqueos/{id}: baja lógica. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
