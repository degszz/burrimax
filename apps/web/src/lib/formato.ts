const pesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** 9000 → "$9.000" */
export function formatoPesos(monto: number): string {
  return `$${pesos.format(monto)}`;
}
