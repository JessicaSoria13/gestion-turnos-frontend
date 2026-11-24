import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoberturaService } from '../../core/services/cobertura.service';
import { Cobertura, Financiador, Paciente } from '../../core/models/turno.model';
import { ToastService } from '../../core/services/toast.service';
import { mensajeDeError } from '../../core/utils/errores';
import { llevarA } from '../../core/utils/scroll';
import { formatearFecha } from '../turnos/fechas';

/**
 * Pacientes y coberturas (solo ADMINISTRADOR, /admin/pacientes).
 * Lista los pacientes; al elegir uno muestra sus coberturas (GET /pacientes/{id}/coberturas)
 * y permite dar de alta una nueva o dar de baja una existente.
 * Los resultados se avisan con toasts (abajo a la izquierda).
 */
@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css',
})
export class PacientesComponent implements OnInit {
  private readonly coberturaService = inject(CoberturaService);
  private readonly toast = inject(ToastService);

  readonly formatearFecha = formatearFecha;

  pacientes = signal<Paciente[]>([]);
  financiadores = signal<Financiador[]>([]);
  seleccionado = signal<Paciente | null>(null);
  coberturas = signal<Cobertura[]>([]);

  // Formulario de alta de cobertura
  idFinanciador: number | null = null;
  numeroAfiliado = '';
  plan = '';

  // Para mostrar "OSDE" en vez del id 2
  readonly nombreFinanciador = computed(() => {
    const nombres: Record<number, string> = {};
    for (const f of this.financiadores()) {
      nombres[f.id] = f.nombre;
    }
    return nombres;
  });

  ngOnInit(): void {
    this.coberturaService.listarPacientes().subscribe({
      next: (lista) =>
        this.pacientes.set(
          [...lista].sort((a, b) => a.nombreApellido.localeCompare(b.nombreApellido)),
        ),
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
    this.coberturaService.financiadores().subscribe({
      next: (lista) => this.financiadores.set(lista.filter((f) => f.activo)),
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  elegir(paciente: Paciente): void {
    this.seleccionado.set(paciente);
    this.limpiarFormulario();
    this.cargarCoberturas();
    // Las coberturas aparecen debajo de la lista: se lleva la pantalla hasta ahí
    llevarA('coberturas-paciente');
  }

  cargarCoberturas(): void {
    const paciente = this.seleccionado();
    if (paciente === null) return;
    this.coberturaService.coberturasDePaciente(paciente.id).subscribe({
      next: (lista) => this.coberturas.set(lista),
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  agregar(): void {
    const paciente = this.seleccionado();
    if (paciente === null || this.idFinanciador === null) return;

    this.coberturaService
      .crear({
        idPaciente: paciente.id,
        idFinanciador: this.idFinanciador,
        numeroAfiliado: this.numeroAfiliado.trim(),
        plan: this.plan.trim() || null,
      })
      .subscribe({
        next: () => {
          this.toast.exito('Cobertura agregada');
          this.limpiarFormulario();
          this.cargarCoberturas();
        },
        // Ej.: 409 "El paciente ya tiene una cobertura con ese financiador y número de afiliado"
        error: (err) => this.toast.error(mensajeDeError(err)),
      });
  }

  darDeBaja(cobertura: Cobertura): void {
    const nombre = this.nombreFinanciador()[cobertura.idFinanciador] ?? 'esta cobertura';
    if (!confirm(`¿Dar de baja ${nombre}, afiliado ${cobertura.numeroAfiliado}?`)) return;
    this.coberturaService.eliminar(cobertura.id).subscribe({
      next: () => {
        this.toast.exito('Cobertura dada de baja');
        this.cargarCoberturas();
      },
      error: (err) => this.toast.error(mensajeDeError(err)),
    });
  }

  private limpiarFormulario(): void {
    this.idFinanciador = null;
    this.numeroAfiliado = '';
    this.plan = '';
  }
}