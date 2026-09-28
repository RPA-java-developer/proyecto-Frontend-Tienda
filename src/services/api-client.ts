const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json();
  } catch {
    return null; // p.ej. un 502 de un proxy con cuerpo HTML/vacío
  }
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function extraerMensaje(cuerpo: unknown, porDefecto: string): string {
  if (esObjeto(cuerpo)) {
    const { message } = cuerpo;
    if (typeof message === 'string') return message;
    // class-validator (ValidationPipe de Nest) devuelve un arreglo de mensajes
    if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join(' · ');
  }
  return porDefecto;
}

async function manejarRespuesta<T>(respuesta: Response): Promise<T> {
  const cuerpo = await leerJson(respuesta);

  if (!respuesta.ok) {
    const code = esObjeto(cuerpo) && typeof cuerpo.code === 'string' ? cuerpo.code : `HTTP_${respuesta.status}`;
    throw new ApiError(code, extraerMensaje(cuerpo, `El servidor respondió con error ${respuesta.status}.`), respuesta.status);
  }

  if (!esObjeto(cuerpo) || !('data' in cuerpo)) {
    throw new ApiError('RESPUESTA_INVALIDA', 'El servidor devolvió una respuesta inesperada.', respuesta.status);
  }
  return cuerpo.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const respuesta = await fetch(`${BASE_URL}${path}`);
  return manejarRespuesta<T>(respuesta);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const respuesta = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return manejarRespuesta<T>(respuesta);
}

/** Convierte cualquier error (ApiError, fallo de red...) en un mensaje apto para el usuario. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
}
