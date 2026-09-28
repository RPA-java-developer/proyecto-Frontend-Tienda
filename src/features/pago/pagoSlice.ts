import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiGet, apiPost, mensajeDeError } from '../../services/api-client';
import type {
  ConfirmarPagoRequest,
  ConfirmarPagoResponseData,
  ConsultarEstadoResponseData,
  DesglosePago,
  IniciarPagoRequest,
  IniciarPagoResponseData,
} from '../../types/api';
import { mapearEstadoTransaccion } from './mapeos';

/**
 * Datos del formulario de tarjeta. Viven SOLO en el estado local del modal (useState)
 * y viajan como argumento transitorio del thunk `confirmarPago`; ningún reducer los guarda.
 */
export interface DatosTarjetaFormulario {
  numeroTarjeta: string;
  mesExpiracion: string;
  anioExpiracion: string;
  cvc: string;
  nombreEnTarjeta: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  numeroCuotas: number;
  aceptaTerminosYCondiciones: boolean;
}

/**
 * Máquina de estados del pago (Flux: cada transición ocurre por una acción):
 *  inactivo -> iniciando -> modalAbierto -> confirmando -> finalizado
 *  (cerrar el modal o un fallo en "iniciar" vuelve a inactivo)
 */
export type FasePago = 'inactivo' | 'iniciando' | 'modalAbierto' | 'confirmando' | 'finalizado';

export interface PagoState {
  cantidad: number;
  fase: FasePago;
  productoId: string | null;
  productoNombre: string | null;
  transaccionId: string | null;
  ordenId: string | null;
  desglose: DesglosePago | null;
  errorInicio: string | null;
  resultado: ConfirmarPagoResponseData | null;
  errorConfirmacion: string | null;
}

const estadoInicial: PagoState = {
  cantidad: 1,
  fase: 'inactivo',
  productoId: null,
  productoNombre: null,
  transaccionId: null,
  ordenId: null,
  desglose: null,
  errorInicio: null,
  resultado: null,
  errorConfirmacion: null,
};

type ConfigThunk = { state: { pago: PagoState }; rejectValue: string };

// ---------- Thunks (efectos asíncronos) ----------

export const iniciarPago = createAsyncThunk<
  IniciarPagoResponseData,
  { usuarioId: string; productoId: string; productoNombre: string },
  ConfigThunk
>(
  'pago/iniciar',
  async ({ usuarioId, productoId }, { getState, rejectWithValue }) => {
    const request: IniciarPagoRequest = { usuarioId, productoId, cantidad: getState().pago.cantidad };
    try {
      return await apiPost<IniciarPagoResponseData>('/pagos/iniciar', request);
    } catch (error) {
      return rejectWithValue(mensajeDeError(error));
    }
  },
  // Anti doble-clic: solo se puede iniciar desde "inactivo".
  { condition: (_, { getState }) => getState().pago.fase === 'inactivo' },
);

export const confirmarPago = createAsyncThunk<
  ConfirmarPagoResponseData,
  { datosTarjeta: DatosTarjetaFormulario; productoNombre: string; cantidad: number },
  ConfigThunk
>(
  'pago/confirmar',
  async ({ datosTarjeta }, { getState, rejectWithValue }) => {
    const { transaccionId } = getState().pago;
    if (!transaccionId) {
      return rejectWithValue('No hay un pago iniciado. Vuelve a intentarlo.');
    }

    const request: ConfirmarPagoRequest = {
      numeroTarjeta: datosTarjeta.numeroTarjeta.replace(/\s/g, ''),
      mesExpiracion: Number(datosTarjeta.mesExpiracion),
      anioExpiracion: Number(datosTarjeta.anioExpiracion),
      cvc: datosTarjeta.cvc,
      nombreEnTarjeta: datosTarjeta.nombreEnTarjeta.trim(),
      tipoIdentificacion: datosTarjeta.tipoIdentificacion,
      numeroIdentificacion: datosTarjeta.numeroIdentificacion.trim(),
      numeroCuotas: datosTarjeta.numeroCuotas,
      aceptaTerminosYCondiciones: datosTarjeta.aceptaTerminosYCondiciones,
    };

    try {
      return await apiPost<ConfirmarPagoResponseData>(`/pagos/${transaccionId}/confirmar`, request);
    } catch (error) {
      return rejectWithValue(mensajeDeError(error));
    }
  },
  // Anti doble-envío: solo se confirma con el modal abierto (el backend además es idempotente).
  { condition: (_, { getState }) => getState().pago.fase === 'modalAbierto' },
);

/** Polling mientras Wompi resuelve un pago PENDIENTE. */
export const consultarEstadoPago = createAsyncThunk<ConsultarEstadoResponseData, { transaccionId: string }, { rejectValue: string }>(
  'pago/consultarEstado',
  async ({ transaccionId }, { rejectWithValue }) => {
    try {
      return await apiGet<ConsultarEstadoResponseData>(`/pagos/${transaccionId}/estado`);
    } catch (error) {
      return rejectWithValue(mensajeDeError(error));
    }
  },
);

// ---------- Slice ----------

const pagoSlice = createSlice({
  name: 'pago',
  initialState: estadoInicial,
  reducers: {
    establecerCantidad(state, action: PayloadAction<{ cantidad: number; maximo: number }>) {
      const { cantidad, maximo } = action.payload;
      state.cantidad = Math.min(Math.max(1, Math.floor(cantidad) || 1), Math.max(1, maximo));
    },
    /** El usuario cierra el modal sin pagar: la orden queda PENDIENTE en el backend (sin cobro). */
    cerrarModal(state) {
      if (state.fase === 'modalAbierto') {
        state.fase = 'inactivo';
        state.transaccionId = null;
        state.ordenId = null;
        state.desglose = null;
      }
    },
    reiniciarPago() {
      return estadoInicial;
    },
  },
  extraReducers: (builder) => {
    builder
      // iniciar
      .addCase(iniciarPago.pending, (state, action) => {
        state.fase = 'iniciando';
        state.productoId = action.meta.arg.productoId;
        state.productoNombre = action.meta.arg.productoNombre;
        state.errorInicio = null;
        state.resultado = null;
        state.errorConfirmacion = null;
      })
      .addCase(iniciarPago.fulfilled, (state, action) => {
        state.fase = 'modalAbierto';
        state.transaccionId = action.payload.transaccionId;
        state.ordenId = action.payload.ordenId;
        state.desglose = action.payload.desglose;
      })
      .addCase(iniciarPago.rejected, (state, action) => {
        state.fase = 'inactivo';
        state.errorInicio = action.payload ?? 'No se pudo iniciar el pago.';
      })
      // confirmar
      .addCase(confirmarPago.pending, (state) => {
        state.fase = 'confirmando';
      })
      .addCase(confirmarPago.fulfilled, (state, action) => {
        state.fase = 'finalizado';
        state.resultado = action.payload;
        state.errorConfirmacion = null;
      })
      .addCase(confirmarPago.rejected, (state, action) => {
        state.fase = 'finalizado';
        state.resultado = null;
        state.errorConfirmacion = action.payload ?? 'No se pudo completar el pago.';
      })
      // polling
      .addCase(consultarEstadoPago.fulfilled, (state, action) => {
        if (state.resultado && state.resultado.transaccionId === action.payload.transaccionId) {
          state.resultado.estado = mapearEstadoTransaccion(action.payload.estado);
        }
      });
  },
});

export const { establecerCantidad, cerrarModal, reiniciarPago } = pagoSlice.actions;
export default pagoSlice.reducer;
