import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('muestra un aviso de éxito y lo saca solo a los 5 segundos', () => {
    const servicio = new ToastService();
    servicio.exito('Cobertura agregada');
    expect(servicio.toasts()).toEqual([{ id: 1, tipo: 'exito', texto: 'Cobertura agregada' }]);

    vi.advanceTimersByTime(5000);
    expect(servicio.toasts()).toEqual([]);
  });

  it('los errores quedan más tiempo (8 segundos)', () => {
    const servicio = new ToastService();
    servicio.error('El horario ya está ocupado');
    vi.advanceTimersByTime(5000);
    expect(servicio.toasts().length).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(servicio.toasts().length).toBe(0);
  });

  it('se puede cerrar a mano y apila como mucho 4', () => {
    const servicio = new ToastService();
    for (let i = 1; i <= 5; i++) servicio.exito(`Aviso ${i}`);
    expect(servicio.toasts().map((t) => t.texto)).toEqual([
      'Aviso 2',
      'Aviso 3',
      'Aviso 4',
      'Aviso 5',
    ]);

    servicio.cerrar(servicio.toasts()[0].id);
    expect(servicio.toasts().length).toBe(3);
  });
});
