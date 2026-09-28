import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import pagoReducer, {
  cerrarModal,
  confirmarPago,
  consultarEstadoPago,
  establecerCantidad,
  iniciarPago,
  reiniciarPago,
  type DatosTarjetaFormulario,
} from './pagoSlice';
import productosReducer from '../productos/productosSlice';
import transaccionesReducer from '../transacciones/transaccionesSlice';

const DESGLOSE = { subtotalEnCentavos: 2000000, tarifaBaseEnCentavos: 100000, tarifaEnvioEnCentavos: 40000, totalEnCentavos: 2140000 };

const TARJETA: DatosTarjetaFormulario = {
  numeroTarjeta: '4242 4242 4242 4242',
  mesExpiracion: '12',
  anioExpiracion: '2029',
  cvc: '987',
  nombreEnTarjeta: 'Juan Perez',
  tipoIdentificacion: 'CC',
  numeroIdentificacion: '1020304050',
  numeroCuotas: 3,
  aceptaTerminosYCondiciones: true,
};

function respuesta(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
}

const respuestaIniciar = () => respuesta(200, { status: 'OK', data: { ordenId: 'o1', transaccionId: 't1', desglose: DESGLOSE } });
const respuestaConfirmar = (estado: string) =>
  respuesta(200, { status: 'OK', data: { ordenId: 'o1', transaccionId: 't1', estado, referenciaPasarela: 'w1', montoTotalEnCentavos: 2140000 } });

function crearStore() {
  return configureStore({ reducer: { productos: productosReducer, pago: pagoReducer, transacciones: transaccionesReducer } });
}

const ARGS_INICIAR = { usuarioId: 'u1', productoId: 'p1', productoNombre: 'Camiseta' };
const ARGS_CONFIRMAR = { datosTarjeta: TARJETA, productoNombre: 'Camiseta', cantidad: 2 };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cantidad', () => {
  it('se limita entre 1 y el stock disponible', () => {
    const store = crearStore();
    store.dispatch(establecerCantidad({ cantidad: 99, maximo: 5 }));
    expect(store.getState().pago.cantidad).toBe(5);
    store.dispatch(establecerCantidad({ cantidad: 0, maximo: 5 }));
    expect(store.getState().pago.cantidad).toBe(1);
    store.dispatch(establecerCantidad({ cantidad: Number.NaN, maximo: 5 }));
    expect(store.getState().pago.cantidad).toBe(1);
  });
});

describe('flujo iniciar -> confirmar', () => {
  it('camino feliz: inactivo -> modalAbierto -> finalizado (APROBADA)', async () => {
    fetchMock.mockResolvedValueOnce(respuestaIniciar()).mockResolvedValueOnce(respuestaConfirmar('APROBADA'));
    const store = crearStore();
    store.dispatch(establecerCantidad({ cantidad: 2, maximo: 10 }));

    await store.dispatch(iniciarPago(ARGS_INICIAR));
    expect(store.getState().pago.fase).toBe('modalAbierto');
    expect(store.getState().pago.desglose).toEqual(DESGLOSE);
    expect(store.getState().pago.transaccionId).toBe('t1');

    // /iniciar envía la cantidad elegida, sin datos de tarjeta
    const [urlIniciar, optsIniciar] = fetchMock.mock.calls[0];
    expect(urlIniciar).toMatch(/\/pagos\/iniciar$/);
    expect(JSON.parse(optsIniciar.body)).toEqual({ usuarioId: 'u1', productoId: 'p1', cantidad: 2 });

    await store.dispatch(confirmarPago(ARGS_CONFIRMAR));
    expect(store.getState().pago.fase).toBe('finalizado');
    expect(store.getState().pago.resultado?.estado).toBe('APROBADA');

    // /confirmar va a la transacción creada, con el número de tarjeta SIN espacios
    const [urlConfirmar, optsConfirmar] = fetchMock.mock.calls[1];
    expect(urlConfirmar).toMatch(/\/pagos\/t1\/confirmar$/);
    const cuerpo = JSON.parse(optsConfirmar.body);
    expect(cuerpo.numeroTarjeta).toBe('4242424242424242');
    expect(cuerpo.mesExpiracion).toBe(12);
    expect(cuerpo.numeroCuotas).toBe(3);
  });

  it('SEGURIDAD: ningún dato de tarjeta queda en el estado de Redux', async () => {
    fetchMock.mockResolvedValueOnce(respuestaIniciar()).mockResolvedValueOnce(respuestaConfirmar('APROBADA'));
    const store = crearStore();
    await store.dispatch(iniciarPago(ARGS_INICIAR));
    await store.dispatch(confirmarPago(ARGS_CONFIRMAR));

    const estadoSerializado = JSON.stringify(store.getState());
    expect(estadoSerializado).not.toContain('4242');
    expect(estadoSerializado).not.toContain('987'); // cvc
    expect(estadoSerializado).not.toContain('Juan Perez');
    expect(estadoSerializado).not.toContain('1020304050');
  });

  it('iniciar rechazado (p.ej. stock insuficiente): vuelve a inactivo y muestra el error', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(409, { status: 'ERROR', code: 'STOCK_INSUFICIENTE', message: 'No hay stock suficiente de "Camiseta".' }),
    );
    const store = crearStore();
    await store.dispatch(iniciarPago(ARGS_INICIAR));

    expect(store.getState().pago.fase).toBe('inactivo');
    expect(store.getState().pago.errorInicio).toBe('No hay stock suficiente de "Camiseta".');
    expect(store.getState().pago.transaccionId).toBeNull();
  });

  it('confirmar rechazado por la pasarela (402): finaliza con mensaje de error, sin resultado', async () => {
    fetchMock
      .mockResolvedValueOnce(respuestaIniciar())
      .mockResolvedValueOnce(respuesta(402, { status: 'ERROR', code: 'PASARELA_RECHAZO', message: 'El pago fue rechazado por la pasarela.' }));
    const store = crearStore();
    await store.dispatch(iniciarPago(ARGS_INICIAR));
    await store.dispatch(confirmarPago(ARGS_CONFIRMAR));

    expect(store.getState().pago.fase).toBe('finalizado');
    expect(store.getState().pago.resultado).toBeNull();
    expect(store.getState().pago.errorConfirmacion).toBe('El pago fue rechazado por la pasarela.');
    expect(store.getState().transacciones.items).toHaveLength(0);
  });

  it('fallo de red al confirmar: mensaje amigable, no revienta', async () => {
    fetchMock.mockResolvedValueOnce(respuestaIniciar()).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const store = crearStore();
    await store.dispatch(iniciarPago(ARGS_INICIAR));
    await store.dispatch(confirmarPago(ARGS_CONFIRMAR));

    expect(store.getState().pago.fase).toBe('finalizado');
    expect(store.getState().pago.errorConfirmacion).toContain('No se pudo conectar');
  });

  it('DOBLE CLIC en pagar: solo se hace UNA llamada a /iniciar', async () => {
    fetchMock.mockResolvedValue(respuestaIniciar());
    const store = crearStore();

    const primera = store.dispatch(iniciarPago(ARGS_INICIAR));
    const segunda = store.dispatch(iniciarPago(ARGS_INICIAR));
    await Promise.all([primera, segunda]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('DOBLE CLIC en confirmar: solo se hace UNA llamada a /confirmar', async () => {
    fetchMock.mockResolvedValueOnce(respuestaIniciar()).mockResolvedValue(respuestaConfirmar('APROBADA'));
    const store = crearStore();
    await store.dispatch(iniciarPago(ARGS_INICIAR));

    const primera = store.dispatch(confirmarPago(ARGS_CONFIRMAR));
    const segunda = store.dispatch(confirmarPago(ARGS_CONFIRMAR));
    await Promise.all([primera, segunda]);

    expect(fetchMock).toHaveBeenCalledTimes(2); // 1 iniciar + 1 confirmar
  });

  it('confirmar no se puede disparar sin haber iniciado (modal cerrado)', async () => {
    const store = crearStore();
    await store.dispatch(confirmarPago(ARGS_CONFIRMAR));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.getState().pago.fase).toBe('inactivo');
  });

  it('cerrar el modal descarta la transacción iniciada y vuelve a inactivo', async () => {
    fetchMock.mockResolvedValueOnce(respuestaIniciar());
    const store = crearStore();
    await store.dispatch(iniciarPago(ARGS_INICIAR));
    store.dispatch(cerrarModal());

    expect(store.getState().pago.fase).toBe('inactivo');
    expect(store.getState().pago.transaccionId).toBeNull();
    expect(store.getState().pago.desglose).toBeNull();
  });

  it('reiniciarPago deja el flujo como nuevo', async () => {
    fetchMock.mockResolvedValueOnce(respuestaIniciar()).mockResolvedValueOnce(respuestaConfirmar('RECHAZADA'));
    const store = crearStore();
    await store.dispatch(iniciarPago(ARGS_INICIAR));
    await store.dispatch(confirmarPago(ARGS_CONFIRMAR));
    store.dispatch(reiniciarPago());

    expect(store.getState().pago.fase).toBe('inactivo');
    expect(store.getState().pago.resultado).toBeNull();
    expect(store.getState().pago.cantidad).toBe(1);
  });
});

describe('pago PENDIENTE + polling', () => {
  it('el polling actualiza el resultado Y el historial cuando Wompi resuelve', async () => {
    fetchMock
      .mockResolvedValueOnce(respuestaIniciar())
      .mockResolvedValueOnce(respuestaConfirmar('PENDIENTE'))
      .mockResolvedValueOnce(
        respuesta(200, { status: 'OK', data: { transaccionId: 't1', ordenId: 'o1', estado: 'APPROVED', referenciaPasarela: 'w1' } }),
      );
    const store = crearStore();
    await store.dispatch(iniciarPago(ARGS_INICIAR));
    await store.dispatch(confirmarPago(ARGS_CONFIRMAR));
    expect(store.getState().pago.resultado?.estado).toBe('PENDIENTE');
    expect(store.getState().transacciones.items[0].estado).toBe('PENDIENTE');

    await store.dispatch(consultarEstadoPago({ transaccionId: 't1' }));
    expect(store.getState().pago.resultado?.estado).toBe('APROBADA');
    expect(store.getState().transacciones.items[0].estado).toBe('APROBADA');
  });

  it('DECLINED/ERROR/VOIDED se muestran como RECHAZADA', async () => {
    for (const estadoBackend of ['DECLINED', 'ERROR', 'VOIDED']) {
      fetchMock
        .mockResolvedValueOnce(respuestaIniciar())
        .mockResolvedValueOnce(respuestaConfirmar('PENDIENTE'))
        .mockResolvedValueOnce(
          respuesta(200, { status: 'OK', data: { transaccionId: 't1', ordenId: 'o1', estado: estadoBackend, referenciaPasarela: 'w1' } }),
        );
      const store = crearStore();
      await store.dispatch(iniciarPago(ARGS_INICIAR));
      await store.dispatch(confirmarPago(ARGS_CONFIRMAR));
      await store.dispatch(consultarEstadoPago({ transaccionId: 't1' }));
      expect(store.getState().pago.resultado?.estado).toBe('RECHAZADA');
    }
  });

  it('una respuesta idempotente repetida NO duplica el historial', async () => {
    const store = crearStore();
    const payload = { ordenId: 'o1', transaccionId: 't1', estado: 'APROBADA' as const, referenciaPasarela: 'w1', montoTotalEnCentavos: 2140000 };

    store.dispatch(confirmarPago.fulfilled(payload, 'req-1', ARGS_CONFIRMAR));
    store.dispatch(confirmarPago.fulfilled(payload, 'req-2', ARGS_CONFIRMAR));

    expect(store.getState().transacciones.items).toHaveLength(1);
  });
});
