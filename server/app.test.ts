import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('API v1', () => {
  it('responde al health check', async () => {
    const res = await app.request('/api/v1/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('devuelve 404 en formato problem+json para rutas inexistentes', async () => {
    const res = await app.request('/api/v1/no-existe');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('application/problem+json');
    expect(await res.json()).toMatchObject({ status: 404, title: 'Not Found', instance: '/api/v1/no-existe' });
  });
});
