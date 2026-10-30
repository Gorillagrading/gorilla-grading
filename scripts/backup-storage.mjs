// Descarga todas las fotos del almacenamiento privado de Supabase a una carpeta local.
// Las copias diarias de Supabase solo guardan la base de datos, no los archivos: esto cubre las fotos.
//
// Uso: node scripts/backup-storage.mjs <carpeta-destino>
//      node scripts/backup-storage.mjs --dry-run      (solo cuenta archivos y tamaño, no descarga nada)
// Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY; SUPABASE_BUCKET es opcional (por defecto "lab-private").
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const outDir = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!dryRun && !outDir) {
  console.error('Falta la carpeta de destino. Uso: node scripts/backup-storage.mjs <carpeta>');
  process.exit(1);
}

const raw = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const base = raw && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const bucket = process.env.SUPABASE_BUCKET ?? 'lab-private';
if (!base || !key) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const api = `${base}/storage/v1`;
// Igual que server/storage.ts: las claves nuevas (sb_secret_…) solo van en "apikey".
const headers = key.startsWith('sb_') ? { apikey: key } : { Authorization: `Bearer ${key}`, apikey: key };
const encode = (path) => path.split('/').map(encodeURIComponent).join('/');

/** Lista una carpeta del bucket, página a página. Las carpetas vienen con id null. */
async function listFolder(prefix) {
  const entries = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${api}/object/list/${bucket}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!res.ok) throw new Error(`No se pudo listar "${prefix || '/'}" (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const page = await res.json();
    entries.push(...page);
    if (page.length < 1000) return entries;
  }
}

async function listAll(prefix = '') {
  const files = [];
  for (const entry of await listFolder(prefix)) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) files.push(...(await listAll(path)));
    else files.push({ path, size: entry.metadata?.size ?? 0 });
  }
  return files;
}

async function download(path) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${api}/object/${bucket}/${encode(path)}`, { headers });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (attempt === 3) throw new Error(`No se pudo descargar "${path}" (${res.status})`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const files = await listAll();
const totalMb = (files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(1);
console.log(`${files.length} archivos en "${bucket}" (${totalMb} MB)`);
if (dryRun) process.exit(0);

let done = 0;
const queue = [...files];
// Cinco descargas a la vez: rápido sin saturar el almacenamiento.
await Promise.all(
  Array.from({ length: 5 }, async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      const target = join(outDir, ...file.path.split('/'));
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, await download(file.path));
      if (++done % 100 === 0) console.log(`  ${done}/${files.length}`);
    }
  }),
);
console.log(`Descargados ${done} archivos.`);
