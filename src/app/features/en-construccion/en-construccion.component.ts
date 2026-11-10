import { Component, input } from '@angular/core';

/**
 * Pantalla provisoria para las rutas que todavía no tienen su componente.
 * El título llega desde `data: { titulo: '...' }` en app.routes.ts
 * (gracias a `withComponentInputBinding()` en app.config.ts).
 * Cada integrante reemplaza su ruta por el componente real cuando lo termina.
 */
@Component({
  selector: 'app-en-construccion',
  standalone: true,
  template: `
    <section class="tarjeta">
      <h2>{{ titulo() }}</h2>
      <p>Pantalla en construcción.</p>
    </section>
  `,
})
export class EnConstruccionComponent {
  titulo = input<string>('');
}
