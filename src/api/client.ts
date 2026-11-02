/**
 * Cliente de la API. La sesión viaja en una cookie httpOnly que el navegador
 * envía solo, así que aquí no se guarda ningún token.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Identificador estable del error (por ejemplo "invalid_code"), si la API lo envía. */
    readonly code: string | undefined,
    message: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<T> {
  let res: Response;
  // Con un tiempo máximo, una petición que se queda colgada acaba en error en vez de esperar para siempre.
  const controller = init.timeoutMs ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), init.timeoutMs) : undefined;
  try {
    res = await fetch(`/api/v1${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      credentials: 'same-origin',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller?.signal,
    });
  } catch {
    throw new ApiError(0, controller?.signal.aborted ? 'timeout' : 'network', 'No se pudo conectar con el servidor.');
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.code, data?.detail ?? data?.title ?? res.statusText, data ?? {});
  }
  return data as T;
}
