/** En Vercel NODE_ENV es "production" en todos los despliegues, incluidos los de preview. */
export const isProduction = () =>
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

/** Clave para cifrar los códigos de acceso y las IP. Sin ella el servidor no debe arrancar el login. */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET debe estar definida y tener al menos 32 caracteres');
  }
  return secret;
}

/** Orígenes desde los que el navegador puede llamar a la API además del propio. */
export function allowedOrigins(): string[] {
  const configured = (process.env.APP_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  return isProduction() ? configured : ['http://localhost:5173', 'http://127.0.0.1:5173', ...configured];
}
