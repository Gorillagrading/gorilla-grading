/**
 * Genera la clave con la que se firman los certificados.
 * Uso: npm run keys:generate
 *
 * Imprime dos valores para guardar en Vercel como variables de entorno:
 *   CERT_SIGNING_KEY  la clave PRIVADA (secreta: márcala como Sensitive y no la compartas ni la subas a Git)
 *   CERT_KEY_ID       un nombre para esta clave, por ejemplo ggi-2026-1
 * La clave pública se publica sola en /api/v1/certificates/keys.
 *
 * Importante: si la clave privada se pierde, no se pueden firmar certificados nuevos; si se filtra,
 * hay que generar otra y revocar lo firmado con ella. Guarda una copia en un gestor de contraseñas.
 */
import { generateSigningKey } from '../server/signing.js';

const year = new Date().getFullYear();
const { privateKey, publicKey } = generateSigningKey();

console.log('\nCopia estos dos valores en Vercel (Settings -> Environment Variables):\n');
console.log(`CERT_KEY_ID=ggi-${year}-1`);
console.log(`CERT_SIGNING_KEY=${privateKey}`);
console.log(`\nClave pública (no es secreta, se publica en la web):\n${publicKey}\n`);
