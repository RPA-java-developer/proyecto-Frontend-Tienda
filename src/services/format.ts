const formateadorCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatearCentavos(centavos: number): string {
  return formateadorCOP.format(centavos / 100);
}
