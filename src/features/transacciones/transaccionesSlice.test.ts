import { beforeEach, describe, expect, it, vi } from 'vitest';

const CLAVE = 'tienda:transacciones:v1';

const VALIDA = {
  ordenId: 'o1',
  transaccionId: 't1',
  productoNombre: 'Camiseta',
  cantidad: 1,
  montoTotalEnCentavos: 1000,
  estado: 'APROBADA',
  fecha: '2026-09-28T12:00:00.000Z',
};

/** El estado inicial se lee de localStorage al importar el módulo: hay que re-importarlo en cada caso. */
async function cargarItemsIniciales(): Promise<unknown[]> {
  vi.resetModules();
  const modulo = await import('./transaccionesSlice');
  return modulo.default(undefined, { type: '@@INIT' }).items;
}

beforeEach(() => {
  localStorage.clear();
});

describe('carga del historial desde localStorage', () => {
  it('arranca vacío si no hay nada guardado', async () => {
    expect(await cargarItemsIniciales()).toEqual([]);
  });

  it('recupera las compras guardadas', async () => {
    localStorage.setItem(CLAVE, JSON.stringify([VALIDA]));
    expect(await cargarItemsIniciales()).toEqual([VALIDA]);
  });

  it('JSON corrupto: arranca vacío sin lanzar', async () => {
    localStorage.setItem(CLAVE, '{esto no es json');
    expect(await cargarItemsIniciales()).toEqual([]);
  });

  it('contenido que no es un arreglo: arranca vacío', async () => {
    localStorage.setItem(CLAVE, JSON.stringify({ hola: 'mundo' }));
    expect(await cargarItemsIniciales()).toEqual([]);
  });

  it('descarta entradas manipuladas o con forma inválida, y conserva las válidas', async () => {
    localStorage.setItem(
      CLAVE,
      JSON.stringify([
        VALIDA,
        { ...VALIDA, transaccionId: 't2', estado: 'HACKEADA' }, // estado inexistente
        { ...VALIDA, transaccionId: 't3', cantidad: '999' }, // tipo incorrecto
        null,
        'texto suelto',
        { ordenId: 'solo-esto' },
      ]),
    );
    expect(await cargarItemsIniciales()).toEqual([VALIDA]);
  });

  it('recorta el historial al máximo permitido', async () => {
    const muchas = Array.from({ length: 80 }, (_, i) => ({ ...VALIDA, transaccionId: `t${i}` }));
    localStorage.setItem(CLAVE, JSON.stringify(muchas));
    expect(await cargarItemsIniciales()).toHaveLength(50);
  });
});
