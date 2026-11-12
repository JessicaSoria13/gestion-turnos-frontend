import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Disponibilidad, DisponibilidadRequest } from '../models/agenda.model';

/**
 * Disponibilidad semanal del médico: /api/v1/disponibilidades.
 * Crear, editar y dar de baja es solo para ADMINISTRADOR. El token lo agrega el interceptor.
 */
@Injectable({
  providedIn: 'root',
})
export class DisponibilidadService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/disponibilidades`;

  /** GET /disponibilidades?idMedico= : las franjas activas de un médico. */
  listar(idMedico: number): Observable<Disponibilidad[]> {
    const params = new HttpParams().set('idMedico', idMedico);
    return this.http.get<Disponibilidad[]>(this.url, { params });
  }

  /** POST /disponibilidades. Errores: 400 (datos inválidos) y 409 (se superpone con otra franja). */
  crear(datos: DisponibilidadRequest): Observable<Disponibilidad> {
    return this.http.post<Disponibilidad>(this.url, datos);
  }

  /** PUT /disponibilidades/{id}. */
  actualizar(id: number, datos: DisponibilidadRequest): Observable<Disponibilidad> {
    return this.http.put<Disponibilidad>(`${this.url}/${id}`, datos);
  }

  /** DELETE /disponibilidades/{id}: baja lógica (activo = false). */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
