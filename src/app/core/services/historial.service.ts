import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paciente, Turno } from '../models/turno.model';
import { ConsultaMedica, Diagnostico, Tratamiento } from '../models/historial.model';

/**
 * Historial clínico, solo ADMINISTRADOR (/admin/historial). Solo lectura.
 * El token lo agrega el interceptor.
 */
@Injectable({
  providedIn: 'root',
})
export class HistorialService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** GET /pacientes: los pacientes activos, para elegir de quién ver el historial. */
  listarPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.api}/pacientes`);
  }

  /** GET /pacientes/{id}/turnos (GDT-99): todos los turnos del paciente, del más nuevo al más viejo. */
  turnosDePaciente(idPaciente: number): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.api}/pacientes/${idPaciente}/turnos`);
  }

  /** GET /consultas-medicas: todas las consultas. La pantalla busca la del turno elegido por su idTurno. */
  consultas(): Observable<ConsultaMedica[]> {
    return this.http.get<ConsultaMedica[]>(`${this.api}/consultas-medicas`);
  }

  /** GET /diagnosticos/consulta/{idConsulta}: los diagnósticos activos de una consulta. */
  diagnosticosDeConsulta(idConsulta: number): Observable<Diagnostico[]> {
    return this.http.get<Diagnostico[]>(`${this.api}/diagnosticos/consulta/${idConsulta}`);
  }

  /** GET /tratamientos?idDiagnostico= : los tratamientos activos de un diagnóstico. */
  tratamientosDeDiagnostico(idDiagnostico: number): Observable<Tratamiento[]> {
    const params = new HttpParams().set('idDiagnostico', idDiagnostico);
    return this.http.get<Tratamiento[]>(`${this.api}/tratamientos`, { params });
  }
}