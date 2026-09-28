import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet, apiPost, mensajeDeError } from './api-client';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function json(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status });
}

describe('api-client', () => {
  it('desempaqueta { status, data }', async () => {
    fetchMock.mockResolvedValue(json(200, { status: 'OK', data: { hola: 'mundo' } }));
    await expect(apiGet('/x')).resolves.toEqual({ hola: 'mundo' });
  });

  it('usa code y message del backend en los errores de dominio', async () => {
    fetchMock.mockResolvedValue(json(404, { status: 'ERROR', code: 'NOT_FOUND', message: 'Producto no encontrado.' }));
    await expect(apiGet('/x')).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Producto no encontrado.', status: 404 });
  });

  it('une los mensajes de class-validator (arreglo) en un solo texto', async () => {
    fetchMock.mockResolvedValue(json(400, { message: ['usuarioId must be a UUID', 'cantidad must not be less than 1'], error: 'Bad Request', statusCode: 400 }));
    await expect(apiPost('/x', {})).rejects.toMatchObject({ message: 'usuarioId must be a UUID · cantidad must not be less than 1' });
  });

  it('tolera respuestas de error que no son JSON (p.ej. 502 de un proxy)', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(apiGet('/x')).rejects.toMatchObject({ code: 'HTTP_502', message: 'El servidor respondió con error 502.' });
  });

  it('rechaza una respuesta 200 sin forma { data }', async () => {
    fetchMock.mockResolvedValue(json(200, { algo: 'raro' }));
    await expect(apiGet('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('mensajeDeError da un texto amigable ante fallos de red', () => {
    expect(mensajeDeError(new TypeError('Failed to fetch'))).toContain('No se pudo conectar');
    expect(mensajeDeError(new ApiError('X', 'Mensaje del servidor', 400))).toBe('Mensaje del servidor');
  });
});
