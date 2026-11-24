import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HistorialComponent } from './historial.component';
import { HistorialService } from '../../core/services/historial.service';
import { ToastService } from '../../core/services/toast.service';
import { Turno } from '../../core/models/turno.model';
import { fechaLocal } from '../turnos/fechas';

/** Turno de ejemplo; se pisa solo lo que cada prueba necesita. */
function turno(cambios: Partial<Turno>): Turno {
  return {
    id: 1,
    idPaciente: 1,
    idMedico: 1,
    idDisponibilidad: 1,
    idCobertura: null,
    fecha: fechaLocal(new Date()),
    hora: '09:00:00',
    estado: 'CONFIRMADO',
    motivoConsulta: null,
    motivoCancelacion: null,
    ...cambios,
  };
}

/** Fecha de hoy corrida `dias` días (negativo = pasado). */
function diaRelativo(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fechaLocal(fecha);
}

describe('HistorialComponent: registrar atención', () => {
  let component: HistorialComponent;
  let registrarConsulta: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    registrarConsulta = vi.fn(() => of({}));
    await TestBed.configureTestingModule({
      imports: [HistorialComponent],
      providers: [
        provideRouter([]),
        {
          provide: HistorialService,
          useValue: { listarPacientes: () => of([]), registrarConsulta },
        },
      ],
    }).compileComponents();
    component = TestBed.createComponent(HistorialComponent).componentInstance;
  });

  it('permite atender un turno confirmado de hoy', () => {
    expect(component.puedeRegistrarAtencion(turno({ fecha: diaRelativo(0) }))).toBe(true);
  });

  it('permite atender un turno confirmado de una fecha pasada', () => {
    expect(component.puedeRegistrarAtencion(turno({ fecha: diaRelativo(-3) }))).toBe(true);
  });

  it('NO permite atender un turno antes de su fecha', () => {
    expect(component.puedeRegistrarAtencion(turno({ fecha: diaRelativo(1) }))).toBe(false);
  });

  it('NO permite atender un turno cancelado ni uno ya atendido', () => {
    expect(component.puedeRegistrarAtencion(turno({ estado: 'CANCELADO' }))).toBe(false);
    expect(component.puedeRegistrarAtencion(turno({ estado: 'ATENDIDO' }))).toBe(false);
  });

  it('no llama al backend si el turno todavía no llegó', () => {
    component.turnoEnRegistro.set(turno({ fecha: diaRelativo(2) }));
    component.registrarAtencion();
    expect(registrarConsulta).not.toHaveBeenCalled();
    const avisos = TestBed.inject(ToastService).toasts();
    expect(avisos.at(-1)?.tipo).toBe('error');
    expect(avisos.at(-1)?.texto).toContain('antes de la fecha del turno');
  });
});
