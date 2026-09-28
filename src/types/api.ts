export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  stock: number;
  precioEnCentavos: number;
}

/** Desglose calculado por el BACKEND (fuente de verdad). El frontend solo lo muestra. */
export interface DesglosePago {
  subtotalEnCentavos: number;
  tarifaBaseEnCentavos: number;
  tarifaEnvioEnCentavos: number;
  totalEnCentavos: number;
}

export interface IniciarPagoRequest {
  usuarioId: string;
  productoId: string;
  cantidad: number;
}

export interface IniciarPagoResponseData {
  ordenId: string;
  transaccionId: string;
  desglose: DesglosePago;
}

export interface ConfirmarPagoRequest {
  numeroTarjeta: string;
  mesExpiracion: number;
  anioExpiracion: number;
  cvc: string;
  nombreEnTarjeta: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  numeroCuotas: number;
  aceptaTerminosYCondiciones: boolean;
}

export type EstadoPago = 'APROBADA' | 'RECHAZADA' | 'PENDIENTE';

export interface ConfirmarPagoResponseData {
  ordenId: string;
  transaccionId: string;
  estado: EstadoPago;
  referenciaPasarela: string;
  montoTotalEnCentavos: number;
}

export type EstadoTransaccion = 'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING' | 'VOIDED';

export interface ConsultarEstadoResponseData {
  transaccionId: string;
  ordenId: string;
  estado: EstadoTransaccion;
  referenciaPasarela: string;
}

/** Lo único que se persiste de una compra en este dispositivo: NUNCA datos de tarjeta. */
export interface TransaccionGuardada {
  ordenId: string;
  transaccionId: string;
  productoNombre: string;
  cantidad: number;
  montoTotalEnCentavos: number;
  estado: EstadoPago;
  fecha: string; // ISO
}
