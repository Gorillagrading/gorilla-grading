# Gorilla Grading

Prototipo web de Gorilla Grading, un servicio de grading de cartas coleccionables (TCG). La aplicación presenta el servicio, explica el proceso, permite seguir pedidos y verificar certificados.

> **Estado:** el front-end sigue usando datos simulados. El backend está en construcción según [docs/engineering/PLAN_BACKEND.pdf](docs/engineering/PLAN_BACKEND.pdf): la Fase 0 (API base, esquema, migraciones, seed y CI) ya está montada.

## Stack

- React 18 y TypeScript (modo estricto)
- Vite 6
- Tailwind CSS 3 y PostCSS
- Framer Motion para animaciones
- Lucide para iconos
- API: Hono en Vercel Functions
- Base de datos: PostgreSQL en Supabase, con Drizzle ORM y migraciones SQL
- Validación: Zod

## Requisitos

- Node.js 24 LTS (versión usada en desarrollo)
- npm

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

### Backend

1. Copia `.env.example` como `.env` y rellena las cadenas de conexión de tu proyecto de Supabase.
2. Aplica las migraciones y carga los datos de ejemplo:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

3. Arranca la API en otra terminal. Vite redirige `/api` a ella:

   ```bash
   npm run dev:api
   ```

   Comprueba que responde en `http://localhost:5173/api/v1/health` y que conecta con la base de datos en `/api/v1/health/db`.

Todas las tablas tienen RLS activado y sin políticas, así que la Data API de Supabase no puede leerlas: solo el backend accede a los datos.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run dev:api` | API local en el puerto 8787 |
| `npm run typecheck` | Comprobación de tipos del frontend y del backend, sin generar archivos |
| `npm test` | Pruebas con Vitest |
| `npm run build` | Comprobación de tipos y build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción para revisarlo localmente |
| `npm run db:generate` | Genera una migración SQL a partir de los cambios en `db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:check` | Comprueba la coherencia de las migraciones |
| `npm run db:seed` | Carga los datos de `src/data/` en una base vacía (no se ejecuta en producción) |
| `npm run db:studio` | Abre Drizzle Studio para explorar la base de datos |

## Estructura

```
.
├── api/                 Punto de entrada de Vercel Functions
├── server/              API (Hono) y lógica de dominio
├── db/                  Esquema, migraciones y seed
├── shared/              Valores de dominio y schemas Zod comunes a frontend y backend
├── src/                 Código de la aplicación
│   ├── components/      Componentes (common/ y luxury/)
│   ├── context/         Estado global: idioma, tema, sesión y concepto
│   ├── data/            Datos simulados (mock) de cartas, pedidos y servicios
│   ├── pages/           Una página por ruta
│   ├── styles/          Estilos globales
│   └── types/           Tipos compartidos
├── public/              Recursos servidos tal cual (imágenes, vídeos, marca)
├── docs/                Documentación: producto, diseño, ingeniería e informes
├── design-assets/       Archivos fuente de diseño (no se sirven en la web)
├── scripts/             Utilidades puntuales para procesar imágenes y código
├── index.html           Punto de entrada HTML
└── vite.config.ts       Configuración de Vite
```

Las rutas de la aplicación se definen en [src/App.tsx](src/App.tsx). El enrutado es propio, basado en `window.history`. En el despliegue, `vercel.json` envía `/api/*` a la función de la API y el resto de rutas a `index.html`.

## Documentación

El índice completo está en [docs/README.md](docs/README.md).

## Scripts de utilidad

Los scripts de `scripts/` son de un solo uso y se conservan como referencia. Los de Python requieren Pillow (`pip install pillow`).

```bash
python scripts/extract_logos.py <imagen_origen>
python scripts/crop_reference.py <imagen_origen>
python scripts/download_logos.py
node scripts/migrate.cjs          # reemplazos masivos de clases en src/
node scripts/reverse_migrate.cjs  # revierte los reemplazos anteriores
```

## Despliegue

Pensado para Vercel: la aplicación de una sola página y la API en `api/` se despliegan juntas. Hay que definir `DATABASE_URL` (pooler de Supabase en modo transacción) en las variables de entorno de Vercel. Las variables están documentadas en `.env.example`.
