import type { EstadoPago, EstadoTransaccion } from '../../types/api';

/** Estados de Wompi/backend -> estados que entiende la UI. */
export function mapearEstadoTransaccion(estado: EstadoTransaccion): EstadoPago {
  switch (estado) {
    case 'APPROVED':
      return 'APROBADA';
    case 'PENDING':
      return 'PENDIENTE';
    default:
      return 'RECHAZADA'; // DECLINED | ERROR | VOIDED
  }
}
