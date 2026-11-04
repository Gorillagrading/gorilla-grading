# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clientes (público):** coleccionistas de cartas TCG (Pokémon, Magic, Yu-Gi-Oh!, One Piece…) que envían cartas a gradear, siguen su pedido y verifican certificados.
- **Equipo del laboratorio (panel interno):** personal con roles `staff` (recibe paquetes, identifica cartas, sube fotos), `grader` (importa el informe PDF del escáner o gradúa a mano), `qa` (aprueba resultados y la salida del pedido) y `admin` (dirección: todo lo anterior más eventos, equipo y negocio). Trabajan todo el día en un ordenador de mesa, también con una tablet junto a la mesa de trabajo o el escáner; la dirección revisa desde el móvil.

## Product Purpose

Gorilla Grading gradea y encapsula cartas coleccionables. Un escáner con IA mide cada carta (centrado en mm, esquinas, bordes, superficie) y genera un informe PDF; el sistema lee ese PDF, el laboratorio lo aprueba con doble firma y se emite un certificado público firmado (Ed25519) con el mismo número que el slab y su QR. Éxito: cada carta pasa por el laboratorio sin errores ni retrasos, y el cliente puede comprobar su nota con todo el detalle del escáner.

## Positioning

La nota sale de medidas reales del escáner, no de una opinión: el certificado muestra el informe completo (milímetros, esquinas ampliadas, daños numerados) y está firmado digitalmente. Doble firma obligatoria: quien gradúa no puede aprobar su propio trabajo.

## Operating Context

- Flujo de un pedido: el cliente paga (Stripe) → el laboratorio confirma la recepción del paquete → identifica cada carta → importa el PDF del escáner (o gradúa a mano) → otra persona aprueba en control de calidad → las fases intermedias avanzan solas según el plazo del servicio → se registra el envío de vuelta y se aprueba la salida, que emite los certificados → entregado.
- Solo la recepción y la aprobación final son manuales; las fases intermedias son un calendario automático.
- Pausas por incidencia y cancelaciones con nota obligatoria.
- Panel interno: Hoy (cola de trabajo por rol), Pedidos (cola filtrable), Eventos (entregas en mano en ferias), Equipo (altas y roles), Negocio (ingresos, clientes, cartas, historial de certificados).

## Capabilities and Constraints

- Hono + Drizzle en Vercel, Postgres en Supabase, React + Vite + Tailwind.
- Idioma de trabajo del panel: español. La web pública es bilingüe (es/en).
- Códigos solo numéricos: pedido 9 cifras, certificado 8–9 (el del PDF del escáner), ticket 7.
- Nada de datos ficticios en la web ni en la base de producción.
- Dirección del laboratorio aún sin definir: no inventarla.

## Brand Commitments

- Nombre **Gorilla Grading**, logotipo del escudo con la "G" en verde. Verde de marca.
- En los slabs y certificados la nota se escribe "GGI" + nota. Sin etiquetas tipo "Mint".
- El panel interno es una herramienta propia (decisión del usuario, 2026-11-04): su propio diseño de back-office, sin el menú ni el pie de la web pública, más denso y serio, manteniendo la marca.

## Evidence on Hand

- Logotipo y marca en el código (`src/components/luxury/GorillaLogo.tsx`).
- Datos reales de pedidos y certificados de prueba en producción (se borrarán antes del lanzamiento). No hay testimonios, clientes ni cifras de negocio que se puedan publicar.

## Product Principles

1. Lo que hay que hacer ahora va primero: la cola de trabajo manda en el panel.
2. La trazabilidad es el producto: cada nota, aprobación y cambio de estado queda registrado y visible.
3. Dos personas para cada resultado: el diseño nunca invita a saltarse la doble firma.
4. Datos medidos antes que adjetivos.
