/**
 * Lleva la pantalla hasta el elemento con ese id (un panel o formulario que se acaba de abrir).
 * Se espera un instante para que Angular termine de dibujarlo antes de mover la vista.
 */
export function llevarA(id: string): void {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
