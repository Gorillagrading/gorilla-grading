# Gorilla Grading

Prototipo web de Gorilla Grading, un servicio de grading de cartas coleccionables (TCG). La aplicación presenta el servicio, explica el proceso, permite seguir pedidos y verificar certificados.

> **Estado:** front-end con datos simulados. No hay backend todavía. El plan de backend está en [docs/engineering/PLAN_BACKEND.pdf](docs/engineering/PLAN_BACKEND.pdf).

## Stack

- React 18 y TypeScript (modo estricto)
- Vite 6
- Tailwind CSS 3 y PostCSS
- Framer Motion para animaciones
- Lucide para iconos

## Requisitos

- Node.js 24 LTS (versión usada en desarrollo)
- npm

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run typecheck` | Comprobación de tipos con TypeScript, sin generar archivos |
| `npm run build` | Comprobación de tipos y build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción para revisarlo localmente |

## Estructura

```
.
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

Las rutas de la aplicación se definen en [src/App.tsx](src/App.tsx). El enrutado es propio, basado en `window.history`, y `vercel.json` redirige todas las rutas a `index.html` para el despliegue.

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

Pensado para Vercel como aplicación de una sola página. No requiere variables de entorno en esta fase.
