import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cobertura, Financiador, Paciente } from '../models/turno.model';

/** Datos del paciente logueado que se necesitan para reservar: su ficha y sus coberturas. */
@Injectable({
  providedIn: 'root',
})
export class PacienteService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** GET /pacientes/me (solo PACIENTE): la ficha del paciente logueado (se obtiene por el DNI del token). */
  obtenerPropio(): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.api}/pacientes/me`);
  }

  /** GET /coberturas?idPaciente= : las coberturas del paciente (el backend controla que sean suyas). */
  coberturas(idPaciente: number): Observable<Cobertura[]> {
    const params = new HttpParams().set('idPaciente', idPaciente);
    return this.http.get<Cobertura[]>(`${this.api}/coberturas`, { params });
  }

  /** GET /financiadores: obras sociales y prepagas, para mostrar el nombre de cada cobertura. */
  financiadores(): Observable<Financiador[]> {
    return this.http.get<Financiador[]>(`${this.api}/financiadores`);
  }
}
