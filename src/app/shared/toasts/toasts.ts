import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

/**
 * Muestra los avisos de ToastService abajo a la izquierda, por encima de todo.
 * Va una sola vez en app.html. Los de éxito se anuncian con role="status" y los de error con
 * role="alert", para que también los lean los lectores de pantalla.
 */
@Component({
  selector: 'app-toasts',
  standalone: true,
  templateUrl: './toasts.html',
  styleUrl: './toasts.css',
})
export class Toasts {
  readonly toastService = inject(ToastService);
}
