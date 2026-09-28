import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from './store';
import { confirmarPago, iniciarPago, reiniciarPago } from '../features/pago/pagoSlice';
import { CLAVE_LOCAL_STORAGE, limpiarHistorial } from '../features/transacciones/transaccionesSlice';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  store.dispatch(reiniciarPago());
  store.dispatch(limpiarHistorial());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function json(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status: 200 });
}

/** Simula una compra completa aprobada (iniciar + confirmar) contra el store REAL de la app. */
async function comprarCamiseta() {
  fetchMock
    .mockResolvedValueOnce(
      json({
        status: 'OK',
        data: {
          ordenId: 'o1',
          transaccionId: 't1',
          desglose: { subtotalEnCentavos: 1000000, tarifaBaseEnCentavos: 50000, tarifaEnvioEnCentavos: 20000, totalEnCentavos: 1070000 },
        },
      }),
    )
    .mockResolvedValueOnce(
      json({ status: 'OK', data: { ordenId: 'o1', transaccionId: 't1', estado: 'APROBADA', referenciaPasarela: 'w1', montoTotalEnCentavos: 1070000 } }),
    );

  await store.dispatch(iniciarPago({ usuarioId: 'u1', productoId: 'p1', productoNombre: 'Camiseta' }));
  await store.dispatch(
    confirmarPago({
      datosTarjeta: {
        numeroTarjeta: '4242 4242 4242 4242',
        mesExpiracion: '12',
        anioExpiracion: '2029',
        cvc: '987',
        nombreEnTarjeta: 'Juan Perez',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '1020304050',
        numeroCuotas: 1,
        aceptaTerminosYCondiciones: true,
      },
      productoNombre: 'Camiseta',
      cantidad: 1,
    }),
  );
}

describe('persistencia del historial en localStorage (store real)', () => {
  it('guarda la compra SIN ningún dato de tarjeta', async () => {
    await comprarCamiseta();

    const guardado = localStorage.getItem(CLAVE_LOCAL_STORAGE);
    expect(guardado).not.toBeNull();

    const items = JSON.parse(guardado as string);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ transaccionId: 't1', productoNombre: 'Camiseta', estado: 'APROBADA', montoTotalEnCentavos: 1070000 });

    // Ni en el objeto guardado ni en TODO localStorage aparece información de la tarjeta.
    const todoElStorage = JSON.stringify({ ...localStorage });
    for (const secreto of ['4242', '987', 'Juan Perez', '1020304050']) {
      expect(todoElStorage).not.toContain(secreto);
    }
  });

  it('borrar el historial también lo borra de localStorage', async () => {
    await comprarCamiseta();
    expect(JSON.parse(localStorage.getItem(CLAVE_LOCAL_STORAGE) as string)).toHaveLength(1); // precondición real

    store.dispatch(limpiarHistorial());

    expect(store.getState().transacciones.items).toEqual([]);
    expect(JSON.parse(localStorage.getItem(CLAVE_LOCAL_STORAGE) as string)).toEqual([]);
  });

  it('no reescribe localStorage cuando el historial no cambió (otras acciones no lo tocan)', async () => {
    await comprarCamiseta();
    const espia = vi.spyOn(Storage.prototype, 'setItem');

    store.dispatch(reiniciarPago()); // acción que NO afecta al historial

    expect(espia).not.toHaveBeenCalled();
    espia.mockRestore();
  });
});
