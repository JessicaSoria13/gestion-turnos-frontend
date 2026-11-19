import { Component, input } from '@angular/core';

/**
 * Armado visual de las pantallas de acceso (login, registro y recuperar contraseña):
 * - Izquierda: panel azul con la marca, el mensaje y las garantías.
 * - Derecha: "Conexión segura", la tarjeta del formulario y el pie.
 *
 * Es solo presentación (no tiene lógica). Cada pantalla le pasa los textos del panel
 * y pone adentro dos cosas:
 * - un elemento con el atributo `recuadro`, que va en el panel azul;
 * - la tarjeta con el formulario, que va en la columna derecha.
 */
@Component({
  selector: 'app-layout-acceso',
  templateUrl: './layout-acceso.html',
  styleUrl: './layout-acceso.css',
  host: { '[class.variante-registro]': "variante() === 'registro'" },
})
export class LayoutAcceso {
  /** Texto del chip de arriba del título (ej.: "Acceso seguro y unificado"). */
  chip = input.required<string>();
  titulo = input.required<string>();
  descripcion = input.required<string>();
  /** 'registro' usa un panel más angosto para dejar lugar a la tarjeta de 2 columnas. */
  variante = input<'normal' | 'registro'>('normal');
}
