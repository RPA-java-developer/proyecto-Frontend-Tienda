import { createSlice } from '@reduxjs/toolkit';
import type { EstadoPago, TransaccionGuardada } from '../../types/api';
import { confirmarPago, consultarEstadoPago } from '../pago/pagoSlice';
import { mapearEstadoTransaccion } from '../pago/mapeos';

export const CLAVE_LOCAL_STORAGE = 'tienda:transacciones:v1';
const MAX_TRANSACCIONES_GUARDADAS = 50;
const ESTADOS_VALIDOS: string[] = ['APROBADA', 'RECHAZADA', 'PENDIENTE'] satisfies EstadoPago[];

/** Valida la forma de lo leído de localStorage (podría estar corrupto o manipulado). */
function esTransaccionValida(valor: unknown): valor is TransaccionGuardada {
  if (typeof valor !== 'object' || valor === null) return false;
  const t = valor as Record<string, unknown>;
  return (
    typeof t.ordenId === 'string' &&
    typeof t.transaccionId === 'string' &&
    typeof t.productoNombre === 'string' &&
    typeof t.cantidad === 'number' &&
    typeof t.montoTotalEnCentavos === 'number' &&
    typeof t.fecha === 'string' &&
    typeof t.estado === 'string' &&
    ESTADOS_VALIDOS.includes(t.estado)
  );
}

function cargarDesdeLocalStorage(): TransaccionGuardada[] {
  try {
    const crudo = localStorage.getItem(CLAVE_LOCAL_STORAGE);
    if (!crudo) return [];
    const parseado: unknown = JSON.parse(crudo);
    return Array.isArray(parseado) ? parseado.filter(esTransaccionValida).slice(0, MAX_TRANSACCIONES_GUARDADAS) : [];
  } catch {
    return []; // contenido corrupto o localStorage no disponible: se arranca vacío, nunca se rompe la app
  }
}

interface TransaccionesState {
  items: TransaccionGuardada[];
}

const transaccionesSlice = createSlice({
  name: 'transacciones',
  initialState: { items: cargarDesdeLocalStorage() } as TransaccionesState,
  reducers: {
    limpiarHistorial(state) {
      state.items = [];
    },
  },
  // El historial reacciona a las MISMAS acciones del flujo de pago (Flux): sin efectos en componentes.
  extraReducers: (builder) => {
    builder
      .addCase(confirmarPago.fulfilled, (state, action) => {
        const { ordenId, transaccionId, estado, montoTotalEnCentavos } = action.payload;
        const { productoNombre, cantidad } = action.meta.arg;

        const existente = state.items.find((t) => t.transaccionId === transaccionId);
        if (existente) {
          existente.estado = estado; // respuesta idempotente repetida: no se duplica
          return;
        }
        state.items = [
          { ordenId, transaccionId, productoNombre, cantidad, montoTotalEnCentavos, estado, fecha: new Date().toISOString() },
          ...state.items,
        ].slice(0, MAX_TRANSACCIONES_GUARDADAS);
      })
      .addCase(consultarEstadoPago.fulfilled, (state, action) => {
        const existente = state.items.find((t) => t.transaccionId === action.payload.transaccionId);
        if (existente) {
          existente.estado = mapearEstadoTransaccion(action.payload.estado);
        }
      });
  },
});

export const { limpiarHistorial } = transaccionesSlice.actions;
export default transaccionesSlice.reducer;
