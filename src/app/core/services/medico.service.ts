import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Lo que devuelve el backend (MedicoResponseDTO). */
export interface Medico {
  id: number;
  nombre: string;
  matricula: string;
  especialidades: string[];
  activo: boolean;
}

/** Médicos: /api/v1/medicos. La versión inicial tiene un solo médico. */
@Injectable({
  providedIn: 'root',
})
export class MedicoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/medicos`;

  /** GET /medicos: los médicos activos. */
  listar(): Observable<Medico[]> {
    return this.http.get<Medico[]>(this.url);
  }
}
