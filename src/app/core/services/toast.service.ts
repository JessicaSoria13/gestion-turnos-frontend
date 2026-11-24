import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error';

/** Un aviso flotante: aparece abajo a la izquierda y se va solo. */
export interface Toast {
  id: number;
  tipo: TipoToast;
  texto: string;
}

// Cuánto tiempo queda visible cada aviso (los errores un poco más, para que se alcancen a leer)
const DURACION_MS: Record<TipoToast, number> = { exito: 5000, error: 8000 };
// Como mucho se apilan 4; si llega otro, se va el más viejo
const MAXIMO = 4;

/**
 * Avisos flotantes (toasts) de toda la app.
 * Las pantallas llaman a exito() o error() después de una acción y el aviso aparece abajo a la
 * izquierda, se vea la parte de la pantalla que se vea. Los muestra el componente Toasts (app.html).
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private proximoId = 1;

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto);
  }

  cerrar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private mostrar(tipo: TipoToast, texto: string): void {
    const id = this.proximoId++;
    this.toasts.update((lista) => [...lista, { id, tipo, texto }].slice(-MAXIMO));
    setTimeout(() => this.cerrar(id), DURACION_MS[tipo]);
  }
}
