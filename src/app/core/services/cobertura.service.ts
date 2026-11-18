import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cobertura, CoberturaRequest, Financiador, Paciente } from '../models/turno.model';

/**
 * Pacientes y sus coberturas, del lado del ADMINISTRADOR (/admin/pacientes).
 * El token lo agrega el interceptor.
 */
@Injectable({
  providedIn: 'root',
})
export class CoberturaService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** GET /pacientes (solo ADMINISTRADOR): los pacientes activos. */
  listarPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.api}/pacientes`);
  }

  /** GET /pacientes/{id}/coberturas (GDT-106): las coberturas activas de un paciente. */
  coberturasDePaciente(idPaciente: number): Observable<Cobertura[]> {
    return this.http.get<Cobertura[]>(`${this.api}/pacientes/${idPaciente}/coberturas`);
  }

  /** GET /financiadores: obras sociales y prepagas, para el desplegable y para mostrar el nombre. */
  financiadores(): Observable<Financiador[]> {
    return this.http.get<Financiador[]>(`${this.api}/financiadores`);
  }

  /**
   * POST /coberturas (201). Errores posibles: 400 (falta el número de afiliado) y
   * 409 (el paciente ya tiene esa cobertura, o el financiador está dado de baja).
   */
  crear(datos: CoberturaRequest): Observable<Cobertura> {
    return this.http.post<Cobertura>(`${this.api}/coberturas`, datos);
  }

  /** DELETE /coberturas/{id}: baja lógica (activo = false). */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/coberturas/${id}`);
  }
}