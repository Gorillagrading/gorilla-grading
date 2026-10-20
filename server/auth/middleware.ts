import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { UserDto } from '../../shared/auth.js';
import type { UserRole } from '../../shared/domain.js';
import type { AppEnv, Deps } from '../context.js';
import { forbidden, unauthenticated } from '../problem.js';
import { findSessionUser } from './service.js';

export const SESSION_COOKIE = 'gg_session';

/** Usuario de la sesión actual, o null si no ha iniciado sesión. Para rutas públicas que cambian según quién pregunta. */
export async function currentUser(deps: Deps, c: Context): Promise<UserDto | null> {
  const token = getCookie(c, SESSION_COOKIE);
  return token ? findSessionUser(deps.getDb(), token) : null;
}

/** Exige una sesión válida y deja el usuario en `c.get('user')`. */
export const requireUser = (deps: Deps) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = await currentUser(deps, c);
    if (!user) throw unauthenticated();
    c.set('user', user);
    await next();
  });

/** Exige que el usuario de la sesión tenga uno de los roles indicados. Va después de `requireUser`. */
export const requireRole = (...roles: UserRole[]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (!roles.includes(c.get('user').role)) throw forbidden();
    await next();
  });
