import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { authSecret } from '../env.js';

/** Token de sesión: lo recibe el navegador en la cookie; en la base solo se guarda su hash. */
export const newSessionToken = () => randomBytes(32).toString('base64url');
export const hashSessionToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const newLoginCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

// Un código de 6 dígitos tiene solo un millón de valores, así que un hash simple se
// rompe al instante. Se usa HMAC con una clave que solo conoce el servidor.
const hmac = (purpose: string, value: string) =>
  createHmac('sha256', authSecret()).update(`${purpose}:${value}`).digest('hex');

export const hashLoginCode = (email: string, code: string) => hmac('login-code', `${email}:${code}`);
export const hashIp = (ip: string) => hmac('ip', ip);

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
