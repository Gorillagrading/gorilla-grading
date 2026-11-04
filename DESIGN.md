---
name: Gorilla Grading · Panel del laboratorio
description: Banco de calibración para el equipo interno (/admin); el plazo de cada pedido se lee sobre una escala.
colors:
  gorilla-green: "#2F8F3E"
  gorilla-green-deep: "#25762F"
  shield-green: "#3FA64F"
  graphite-rail: "#1A1D1C"
  graphite-raised: "#2A2F2D"
  graphite-hover: "#232725"
  graphite-rule: "#2C302E"
  rail-text: "#C4C8C3"
  rail-muted: "#A3A9A4"
  bench-floor: "#EDEEEA"
  sheet: "#FFFFFF"
  sheet-tint: "#F7F8F5"
  group-band: "#F4F5F2"
  fillet: "#D7D9D3"
  fillet-soft: "#ECEDE9"
  track: "#E2E4DF"
  field-stroke: "#C7CAC4"
  ink: "#121413"
  ink-soft: "#3D423F"
  muted: "#5A5F5B"
  placeholder: "#6B706C"
  tick: "#A9AEA9"
  inert: "#B8BCB6"
  received-cyan: "#1E8FC6"
  phase-1: "#8CC79A"
  phase-2: "#4FA862"
  phase-4: "#1F6B2B"
  qa-violet: "#6A4FC4"
  shipped-graphite: "#3A403D"
  warning-amber: "#C98A12"
  warning-amber-text: "#8A6A12"
  overdue-red: "#B42B22"
  overdue-rule: "#E3B3AE"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' 1"
  stat:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    fontFeature: "'tnum' 1"
  body-small:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  code:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0"
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.05em"
  status:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "10.5px"
    fontWeight: 700
    letterSpacing: "0.05em"
rounded:
  sheet: "3px"
  dot: "9999px"
spacing:
  rail: "240px"
  topbar: "56px"
  page-x: "32px"
  page-y: "24px"
  gap: "24px"
  row-x: "20px"
  row-y: "12px"
components:
  button-primary:
    backgroundColor: "{colors.gorilla-green}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.gorilla-green-deep}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    height: "36px"
    padding: "0 14px"
  input-search:
    backgroundColor: "{colors.sheet-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    height: "36px"
    padding: "0 12px 0 36px"
  filter-chip:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-small}"
    rounded: "{rounded.sheet}"
    height: "28px"
    padding: "0 10px"
  filter-chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
  nav-item:
    backgroundColor: "{colors.graphite-rail}"
    textColor: "{colors.rail-text}"
    rounded: "{rounded.sheet}"
    height: "40px"
    padding: "0 12px"
  nav-item-hover:
    backgroundColor: "{colors.graphite-hover}"
  nav-item-active:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.sheet}"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
  status-pill:
    textColor: "{colors.ink}"
    typography: "{typography.status}"
---

# Design System: Gorilla Grading · Panel del laboratorio

## Overview

**Creative North Star: "Banco de calibración"**

El panel interno (/admin) es el banco de medida del laboratorio: el plazo de cada pedido se lee sobre una escala, no se adivina. Un carril lateral grafito sostiene la herramienta; el trabajo ocurre en hojas blancas apoyadas sobre un suelo gris banco, separadas por filetes de 1 px. La densidad es la de un instrumento: filas compactas, cifras tabulares, códigos en mono, y color solo cuando significa algo (acción principal, avance, o una fase concreta de la carta de calibración).

El orden de lectura es fijo: primero lo urgente (fuera de plazo), luego la cola por acción, luego el estado del laboratorio entero. Los estados se sellan y nunca desaparecen: pausas y cancelaciones siguen visibles con su parche. El panel es siempre claro; se usa en un laboratorio iluminado. Rechaza el dashboard de tarjetas de colores con iconos y saludos.

Este mundo cubre solo el panel interno. La web pública (`/`, cuenta del cliente, verificador) conserva su propio aspecto y no hereda estas reglas.

**Key Characteristics:**
- Carril grafito fijo de 240 px + barra superior blanca de 56 px con búsqueda por número.
- Hojas blancas con filete de 1 px y esquinas de 3 px sobre suelo gris banco; sin sombras en reposo.
- Una familia (Archivo Variable) con cifras tabulares, más JetBrains Mono para códigos, recuentos y rótulos de dato.
- Verde Gorilla solo para la acción principal, el avance y el foco.
- Estados codificados como parches de una carta de calibración (STAGE_COLOR).
- Firma: la regla de plazo en cada fila de la cola.

## Colors

Grises verdosos de banco de trabajo con un único verde de acción y una carta de parches para los estados.

### Primary
- **Verde Gorilla** (gorilla-green): botón principal, tramo de avance de la regla de plazo, anillo de foco, selección de texto, caret de los campos, marca de las gráficas.
- **Verde Gorilla hondo** (gorilla-green-deep): hover del botón principal, enlaces de acción en texto ("Abrir en Pedidos"), cifras positivas.
- **Verde escudo** (shield-green): solo el escudo del carril y el filete vertical de 2 px del elemento de navegación activo.

### Secondary: la carta de calibración (STAGE_COLOR)
- **Cian recibido** (received-cyan): por recibir (SUBMITTED).
- **Escalera verde** (phase-1 → gorilla-green → phase-4): recibido, preinspección, gradeo óptico, encapsulado; el verde se oscurece según avanza.
- **Violeta calidad** (qa-violet): control de calidad, la segunda firma.
- **Grafito enviado** (shipped-graphite) y **tinta** (ink): enviado y entregado.
- **Ámbar aviso** (warning-amber): pago pendiente, en pausa, plazo justo (≤ 1 día). Su texto usa warning-amber-text.
- **Rojo vencido** (overdue-red): cancelado, fuera de plazo, errores, marca de fecha prevista. overdue-rule es el filete de la hoja de aviso de retraso.
- **Inerte** (inert): borrador; también la línea de tendencia de las gráficas.

### Neutral
- **Grafito carril** (graphite-rail), **grafito alzado** (graphite-raised, activo), **grafito hover** (graphite-hover), **filete de carril** (graphite-rule), con texto rail-text y secundario rail-muted.
- **Suelo banco** (bench-floor): fondo de página; también hover fantasma.
- **Hoja** (sheet): toda superficie de trabajo. **Hoja tintada** (sheet-tint): hover de filas y parches, fondo del buscador en reposo. **Banda de grupo** (group-band): cabecera de cada grupo de la cola.
- **Filete** (fillet): bordes de hoja y divisiones principales. **Filete suave** (fillet-soft): divisiones entre filas. **Pista** (track): parte vacía de barras y escalas. **Trazo de campo** (field-stroke): bordes de inputs y botones secundarios.
- **Tinta** (ink), **tinta suave** (ink-soft), **apagado** (muted, texto secundario), **placeholder**, **tick** (marcas de la escala, cifras a cero).

### Named Rules
**The Green Means Go Rule.** El verde Gorilla marca la acción principal y el avance; nunca decora. Una pantalla tiene como mucho un botón primario por bloque de decisión.

**The Calibration Chart Rule.** El color de un estado sale siempre de STAGE_COLOR. No se inventan colores de estado por pantalla.

**The Fixed Scale Rule.** La urgencia se expresa con la escala (verde en plazo, ámbar ≤ 1 día, rojo vencido), no con colores sueltos.

## Typography

**Display Font:** Archivo Variable (con Archivo, system-ui)
**Body Font:** Archivo Variable, con `font-feature-settings: 'tnum' 1` en todo el panel
**Label/Mono Font:** JetBrains Mono 400/600 (con ui-monospace)

**Character:** Una sola familia sans técnica y sobria para todo el texto; el mono aparece donde hay que leer un dato exacto: números de pedido, recuentos, rótulos de columna y de campo.

### Hierarchy
- **Display** (700, 26px, tracking -0.01em): el resumen de Hoy ("N tareas pendientes").
- **Stat** (700, 28px, line-height 1): la cifra de cada parche de la tira de calibración; a cero va en color tick.
- **Headline** (700, 17px): título de sección en la barra superior.
- **Title** (700, 16px): título de una hoja ("Tu cola de trabajo"); 13-14px bold para cabeceras de grupo y avisos.
- **Body** (400-600, 14px): nombres en filas, texto corriente; 13px para notas y avisos.
- **Body small** (12px): pistas, estado de plazo, metadatos.
- **Code** (JetBrains Mono, 12px): número de pedido y posición de carta bajo el nombre; 11px para contadores en chips.
- **Label** (JetBrains Mono, 700, 10px, mayúsculas, tracking 0.05em): cabeceras de tabla, rótulos `dt` y de campo. Es rótulo de un dato, no titular de sección.

### Named Rules
**The Measured Figure Rule.** Toda cifra se compone tabular; los códigos van en mono. Ningún número baila al actualizarse.

## Layout

En ordenador (≥ 1024px): rejilla de dos columnas `240px | 1fr`; el carril es sticky a pantalla completa. Por debajo, el carril pasa a cajón de 260px (máx. 80vw) abierto desde un botón en la barra superior, sobre un velo negro al 40%.

La barra superior mide 56px, blanca con filete inferior, sticky: título de sección, buscador (máx. 420px) y fecha. El contenido vive en `main` con ancho máximo 1320px, padding horizontal 16 / 24 / 32px según ancho y 24px vertical; los bloques se separan 24px.

Hoy: resumen, tira de calibración (2 / 4 / 8 columnas según ancho, divididas por filetes), y debajo cola de trabajo + columna de avisos de 300px (en xl). Las filas de la cola usan una rejilla `1.2fr | 1fr | 220px | 16px` (la tercera columna es la regla de plazo) con padding 20px × 12px; en móvil se apilan.

## Elevation & Depth

Plano por defecto. La profundidad se construye por capas tonales (suelo gris → hoja blanca → banda de grupo) y filetes de 1 px, no por sombras. Las sombras existen solo en capas flotantes que tapan contenido.

### Shadow Vocabulary
- **Cajón** (`box-shadow: 8px 0 24px rgba(0,0,0,0.25)`): carril abierto como cajón en tablet y móvil.
- **Diálogo** (`shadow-2xl` de Tailwind): diálogo de acción del detalle de pedido.
- **Tooltip** (`shadow-lg` de Tailwind): tooltip de las gráficas.

### Named Rules
**The Flat Bench Rule.** Ninguna hoja en reposo lleva sombra. Si algo necesita destacar, cambia su filete (rojo para retraso) o su posición en la cola, no su elevación.

## Shapes

Esquinas casi rectas de 3px en hojas, botones, campos, chips y elementos de navegación. El círculo queda para piezas pequeñas no rectangulares: puntos de estado, avatares de iniciales, el sello de "todo al día". Los marcadores de estado son cuadrados (8px) y los segmentos de avance son barras de 3px de alto: geometría de instrumento, sin píldoras.

## Components

### Buttons
- **Shape:** esquinas de 3px.
- **Primary:** fondo verde Gorilla, texto blanco, 600, 14px; hover a verde hondo. Altura 40px en bloques de acción.
- **Secondary:** hoja blanca con trazo de campo, texto tinta, 600; hover endurece el borde a tinta. Altura 36px, padding 14px.
- **Text link:** verde hondo, 600, 12-13px, subrayado al hover con offset 4px.
- **Focus:** contorno de 2px verde Gorilla con offset 2px en todo el panel. Disabled: opacidad 60%.

### Chips (filtros de la cola)
- **Style:** 28px de alto, 3px, borde trazo de campo, texto 12px 500 y contador mono 11px.
- **State:** activo invierte a fondo tinta con texto blanco y contador rail-text; hover endurece el borde a tinta.

### Cards / Containers (hojas)
- **Corner Style:** 3px.
- **Background:** blanco sobre suelo banco.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** filete de 1px; la hoja de aviso de retraso usa overdue-rule.
- **Internal Padding:** cabecera 20px × 16px con filete inferior; avisos 16px.

### Inputs / Fields
- **Style:** borde trazo de campo, 3px, texto 14px, placeholder en su gris; el buscador superior reposa en hoja tintada con icono de lupa a la izquierda.
- **Focus:** fondo pasa a blanco, borde verde Gorilla y halo de 2px verde al 20%; caret verde.

### Navigation (carril)
- **Style:** grafito, cabecera de 64px con escudo y "Gorilla Grading / Laboratorio", filetes grafito.
- **Items:** 40px, 14px, icono de línea de 18px (trazo 1.75); hover a grafito hover y texto blanco.
- **Active:** grafito alzado, texto blanco 600 y filete vertical de 2px verde escudo a la izquierda.
- **Pie:** nombre y rol, enlaces "Ver la web" y "Cerrar sesión" en 12px.

### Status Pill (sello de estado)
Marcador cuadrado sólido de 8px con el color de STAGE_COLOR, nombre del estado en mono 10.5px bold mayúsculas y, en el recorrido normal, siete segmentos de 14 × 3px separados 3px: los recorridos en el color de la fase, el resto en pista. Sin caja ni fondo.

### Tira de calibración
Una hoja dividida en parches por fase. Cada parche: banda de color de 6px a sangre arriba, nombre de fase 12px apagado, cifra stat y línea "En plazo" o "N fuera de plazo" en rojo. Todo el parche es botón hacia la lista filtrada; hover hoja tintada.

### Regla de plazo (firma)
Escala de 14px de alto en cada fila de la cola: ticks de 1px en color tick, uno por día (agrupados si el plazo pasa de 30 días); pista de 3px; tramo de avance verde hasta hoy o la fecha prevista; marca vertical roja de 2px en la fecha prevista; cruz de registro en tinta (1 × 18px y 9 × 1px) en hoy. Si va tarde, la escala se alarga y el tramo entre la marca y hoy va en rojo. Sobre la escala, el estado en 12px 600 con el color de la escala fija. Sin fechas: texto apagado ("Plazo sin empezar", "Plazo detenido" en ámbar).

## Do's and Don'ts

### Do:
- **Do** consumir `usePanelTheme()` para hojas, texto, campos y botones en cualquier pantalla nueva del panel.
- **Do** colorear cualquier estado con STAGE_COLOR y mostrarlo con el sello de estado.
- **Do** separar con filetes de 1px (fillet, fillet-soft) y capas tonales, con esquinas de 3px.
- **Do** poner números de pedido, recuentos y medidas en JetBrains Mono y todas las cifras tabulares.
- **Do** ordenar lo urgente primero y mostrar pausas y cancelaciones, nunca ocultarlas.

### Don't:
- **Don't** usar sombras en hojas en reposo; solo cajón, diálogo y tooltip.
- **Don't** usar el verde Gorilla como decoración o fondo de bloques.
- **Don't** inventar colores de estado o de rol fuera de la carta de calibración.
- **Don't** construir tarjetas de colores con icono grande y saludo; el panel abre con la cola.
- **Don't** usar píldoras redondeadas para estados; el sello es cuadrado.
- **Don't** traer el aspecto de la web pública (menú, pie, fondos crema) al panel.
