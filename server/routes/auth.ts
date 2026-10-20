import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { RequestCodeBody, VerifyCodeBody } from '../../shared/auth.js';
import { SESSION_COOKIE, requireUser } from '../auth/middleware.js';
import { CODE_TTL_MS, issueLoginCode, revokeSession, verifyLoginCode } from '../auth/service.js';
import type { AppEnv, Deps } from '../context.js';
import { isProduction } from '../env.js';
import { clientIp, parseJson } from '../http.js';

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'Lax' as const,
  path: '/',
});

export function authRoutes(deps: Deps) {
  const routes = new Hono<AppEnv>();

  // Pide un código de acceso. La respuesta es la misma exista o no la cuenta,
  // para que nadie pueda averiguar qué emails están registrados.
  routes.post('/auth/otp', async (c) => {
    const { email, locale } = await parseJson(c, RequestCodeBody);
    const { code } = await issueLoginCode(deps.getDb(), { email, ip: clientIp(c) });
    await deps.sendLoginCode(email, code, locale ?? 'es');
    return c.json({ status: 'sent', expiresInSeconds: CODE_TTL_MS / 1000 }, 202);
  });

  routes.post('/auth/otp/verify', async (c) => {
    const { email, code } = await parseJson(c, VerifyCodeBody);
    const { user, token, expiresAt } = await verifyLoginCode(deps.getDb(), {
      email,
      code,
      ip: clientIp(c),
      userAgent: c.req.header('user-agent') ?? null,
    });
    setCookie(c, SESSION_COOKIE, token, { ...cookieOptions(), expires: expiresAt });
    return c.json({ user });
  });

  routes.post('/auth/logout', async (c) => {
    const token = getCookie(c, SESSION_COOKIE);
    if (token) await revokeSession(deps.getDb(), token);
    deleteCookie(c, SESSION_COOKIE, cookieOptions());
    return c.body(null, 204);
  });

  routes.get('/me', requireUser(deps), (c) => c.json({ user: c.get('user') }));

  return routes;
}
