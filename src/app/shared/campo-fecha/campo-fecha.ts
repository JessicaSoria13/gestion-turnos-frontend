import { Component, ElementRef, effect, forwardRef, input, signal, viewChild } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

/**
 * Campo de fecha que siempre se muestra como dd/mm/aaaa, sin importar el idioma del navegador
 * (el input type="date" nativo usa el formato del sistema y puede mostrar mm/dd/aaaa).
 * Hacia afuera (ngModel) trabaja con "yyyy-MM-dd", igual que el input nativo y el backend.
 * El botón del calendario abre el selector nativo.
 */
@Component({
  selector: 'app-campo-fecha',
  templateUrl: './campo-fecha.html',
  styleUrl: './campo-fecha.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoFecha), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => CampoFecha), multi: true },
  ],
})
export class CampoFecha implements ControlValueAccessor, Validator {
  /** Id del input visible, para asociarlo con su <label for>. */
  idInput = input<string>('');
  /** Fecha mínima en "yyyy-MM-dd". */
  min = input<string | null>(null);
  /** Fecha máxima en "yyyy-MM-dd". */
  max = input<string | null>(null);

  private readonly selector = viewChild.required<ElementRef<HTMLInputElement>>('selector');

  texto = signal('');
  valorIso = signal('');
  deshabilitado = signal(false);

  private onChange: (valor: string) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(valor: string | null): void {
    this.valorIso.set(valor ?? '');
    this.texto.set(valor ? valor.split('-').reverse().join('/') : '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }

  /** Mientras se escribe: agrega las barras solas y avisa el valor si la fecha está completa. */
  alEscribir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const digitos = campo.value.replace(/\D/g, '').slice(0, 8);
    let texto = digitos;
    if (digitos.length > 4) texto = `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
    else if (digitos.length > 2) texto = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    campo.value = texto;
    this.texto.set(texto);

    const iso = this.aIso(texto);
    this.valorIso.set(iso ?? '');
    // Mientras la fecha esté incompleta o no exista se manda vacío (así nadie usa una fecha a medias)
    // y el validador la marca inválida mirando el texto escrito
    this.onChange(iso ?? '');
  }

  /** Cuando se elige una fecha en el calendario nativo. */
  alElegir(evento: Event): void {
    const iso = (evento.target as HTMLInputElement).value;
    this.writeValue(iso);
    this.onChange(iso);
    this.onTouched();
  }

  abrirCalendario(): void {
    const selector = this.selector().nativeElement;
    if (typeof selector.showPicker === 'function') {
      selector.showPicker();
    } else {
      selector.focus();
      selector.click();
    }
  }

  alSalir(): void {
    this.onTouched();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const valor = control.value as string | null;
    if (!valor) {
      // Vacío pero con algo escrito: la fecha está incompleta o no existe. Totalmente vacío lo valida "required"
      return this.texto() ? { fechaInvalida: true } : null;
    }
    const min = this.min();
    if (min && valor < min) return { fechaMinima: { min } };
    const max = this.max();
    if (max && valor > max) return { fechaMaxima: { max } };
    return null;
  }

  /** "dd/mm/aaaa" -> "aaaa-mm-dd", o null si la fecha está incompleta o no existe (ej.: 31/02). */
  private aIso(texto: string): string | null {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
    if (!partes) return null;
    const [, dia, mes, anio] = partes;
    const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
    if (
      fecha.getFullYear() !== Number(anio) ||
      fecha.getMonth() !== Number(mes) - 1 ||
      fecha.getDate() !== Number(dia)
    ) {
      return null;
    }
    return `${anio}-${mes}-${dia}`;
  }

  constructor() {
    // Si cambia el mínimo (ej.: "hasta" depende de "desde"), se vuelve a validar
    effect(() => {
      this.min();
      this.max();
      this.onValidatorChange();
    });
  }
}
