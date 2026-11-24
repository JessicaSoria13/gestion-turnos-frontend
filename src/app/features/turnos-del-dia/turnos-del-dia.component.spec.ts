import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TurnosDelDiaComponent } from './turnos-del-dia.component';
import { TurnoService } from '../../core/services/turno.service';
import { PacienteService } from '../../core/services/paciente.service';
import { ToastService } from '../../core/services/toast.service';
import { Turno } from '../../core/models/turno.model';
import { fechaLocal } from '../turnos/fechas';

/** Fecha de hoy corrida `dias` días (negativo = pasado). */
function dia(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fechaLocal(fecha);
}

function turno(cambios: Partial<Turno>): Turno {
  return {
    id: 1,
    idPaciente: 1,
    idMedico: 1,
    idDisponibilidad: 1,
    idCobertura: null,
    fecha: dia(0),
    hora: '09:00:00',
    estado: 'CONFIRMADO',
    motivoConsulta: null,
    motivoCancelacion: null,
    ...cambios,
  };
}

describe('TurnosDelDiaComponent', () => {
  let component: TurnosDelDiaComponent;
  let cancelar: ReturnType<typeof vi.fn>;

  const turnos = [
    turno({ id: 1, hora: '10:00:00' }),
    turno({ id: 2, hora: '09:00:00', estado: 'ATENDIDO' }),
    turno({ id: 3, hora: '09:30:00', estado: 'CANCELADO' }),
    turno({ id: 4, fecha: dia(1) }),
  ];

  beforeEach(async () => {
    cancelar = vi.fn(() => of({}));
    await TestBed.configureTestingModule({
      imports: [TurnosDelDiaComponent],
      providers: [
        provideRouter([]),
        { provide: TurnoService, useValue: { listar: () => of(turnos), cancelar } },
        {
          provide: PacienteService,
          useValue: {
            listar: () => of([{ id: 1, nombreApellido: 'Juan Pérez', dni: '32111222' }]),
          },
        },
      ],
    }).compileComponents();
    component = TestBed.createComponent(TurnosDelDiaComponent).componentInstance;
    component.ngOnInit();
  });

  it('muestra solo los turnos de hoy, ordenados por hora', () => {
    expect(component.turnosDelDia().map((t) => t.id)).toEqual([2, 3, 1]);
    expect(component.resumen()).toBe('3 turnos · 1 confirmado · 1 atendido · 1 cancelado');
  });

  it('al pasar al día siguiente muestra los de mañana', () => {
    component.moverDia(1);
    expect(component.turnosDelDia().map((t) => t.id)).toEqual([4]);
  });

  it('atender: solo CONFIRMADO de hoy o anterior; cancelar: solo CONFIRMADO de hoy en adelante', () => {
    expect(component.puedeAtender(turno({ fecha: dia(-2) }))).toBe(true);
    expect(component.puedeAtender(turno({ fecha: dia(1) }))).toBe(false);
    expect(component.puedeCancelar(turno({ fecha: dia(1) }))).toBe(true);
    expect(component.puedeCancelar(turno({ fecha: dia(-1) }))).toBe(false);
    expect(component.puedeCancelar(turno({ estado: 'ATENDIDO' }))).toBe(false);
  });

  it('no cancela sin motivo: es obligatorio cuando cancela el médico', () => {
    component.motivoCancelacion = '   ';
    component.confirmarCancelacion(turnos[0]);
    expect(cancelar).not.toHaveBeenCalled();
    expect(TestBed.inject(ToastService).toasts().at(-1)?.tipo).toBe('error');
  });

  it('con motivo cancela y avisa con un toast', () => {
    component.motivoCancelacion = 'La médica tuvo una urgencia';
    component.confirmarCancelacion(turnos[0]);
    expect(cancelar).toHaveBeenCalledWith(1, { motivoCancelacion: 'La médica tuvo una urgencia' });
    expect(TestBed.inject(ToastService).toasts().at(-1)?.texto).toContain('Juan Pérez');
  });
});
