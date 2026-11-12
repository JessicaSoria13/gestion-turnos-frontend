/** Fecha en formato yyyy-MM-dd con la hora local (toISOString usa UTC y de noche daría el día siguiente). */
export function fechaLocal(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** "2026-11-20" -> "20/11/2026" */
export function formatearFecha(fecha: string): string {
  return fecha.split('-').reverse().join('/');
}
