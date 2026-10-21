import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { ProblemError } from './problem.js';

/**
 * Firma de certificados con Ed25519. El registro que se firma es el JSON canónico (claves ordenadas,
 * sin espacios) para que quien lo verifique obtenga exactamente los mismos bytes.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export interface Signer {
  keyId: string;
  /** Clave pública (SPKI DER en base64), la que cualquiera puede usar para verificar. */
  publicKey: string;
  /** Firma en base64url del JSON canónico del registro. */
  sign(record: unknown): string;
}

const unavailable = () =>
  new ProblemError(503, 'Service Unavailable', 'La firma de certificados no está configurada.', { code: 'signing_unavailable' });

/** Crea un firmador a partir de una clave privada PKCS8 (DER en base64). */
export function createSigner(privateKeyBase64: string, keyId: string): Signer {
  const privateKey = createPrivateKey({ key: Buffer.from(privateKeyBase64, 'base64'), format: 'der', type: 'pkcs8' });
  const publicKey = createPublicKey(privateKey).export({ format: 'der', type: 'spki' }).toString('base64');
  return {
    keyId,
    publicKey,
    sign: (record) => sign(null, Buffer.from(canonicalJson(record)), privateKey).toString('base64url'),
  };
}

/** Firmador de producción: CERT_SIGNING_KEY (PKCS8 en base64) y CERT_KEY_ID. */
export function loadSigner(): Signer {
  const key = process.env.CERT_SIGNING_KEY;
  const keyId = process.env.CERT_KEY_ID;
  if (!key || !keyId) throw unavailable();
  try {
    return createSigner(key, keyId);
  } catch {
    throw unavailable();
  }
}

/** Comprueba una firma con la clave pública (SPKI DER en base64). */
export function verifySignature(publicKeyBase64: string, record: unknown, signature: string): boolean {
  try {
    const key = createPublicKey({ key: Buffer.from(publicKeyBase64, 'base64'), format: 'der', type: 'spki' });
    return verify(null, Buffer.from(canonicalJson(record)), key, Buffer.from(signature, 'base64url'));
  } catch {
    return false;
  }
}

/** Genera un par de claves nuevo. Solo para el script de configuración y las pruebas. */
export function generateSigningKey() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKey: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
    publicKey: publicKey.export({ format: 'der', type: 'spki' }).toString('base64'),
  };
}
