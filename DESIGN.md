---
name: Gorilla Grading · Panel del laboratorio
description: Banco de calibración en versión mínima para el equipo interno (/admin); una sola tinta y color solo cuando significa algo.
colors:
  ink: "#0F1110"
  ink-hover: "#2A2E2B"
  ink-soft: "#3B3F3C"
  muted: "#666A67"
  faint: "#8A8E8B"
  idle: "#C9CBC7"
  closed-dot: "#9A9E9B"
  late: "#C2362B"
  warn: "#A86A12"
  gorilla-green: "#2F8F3E"
  positive: "#25762F"
  canvas: "#F6F6F3"
  sheet: "#FFFFFF"
  row-hover: "#FAFAF8"
  wash: "#F1F1EE"
  segment-tray: "#EDEDE9"
  track: "#ECECE8"
  fillet: "#E7E7E2"
  field-stroke: "#E1E1DC"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
  station-count:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    fontFeature: "'tnum' 1"
  body-small:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
  code:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    letterSpacing: "0"
  count:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "11.5px"
    fontWeight: 400
    letterSpacing: "0"
rounded:
  key: "4px"
  control: "6px"
  field: "8px"
  sheet: "8px"
  sheet-lg: "10px"
  dot: "9999px"
spacing:
  rail: "248px"
  topbar: "60px"
  page-x: "40px"
  page-y: "32px"
  section-gap: "32px"
  row-x: "20px"
  row-y: "10px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.control}"
    height: "28px"
    padding: "0 12px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "28px"
    padding: "0 12px"
  input-search:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "32px"
    padding: "0 32px"
  segmented:
    backgroundColor: "{colors.segment-tray}"
    rounded: "{rounded.field}"
    padding: "2px"
  segment:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 12px"
  segment-on:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
  nav-item:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    height: "34px"
    padding: "0 10px"
  nav-item-hover:
    backgroundColor: "{colors.canvas}"
  nav-item-active:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
  sheet-lg:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet-lg}"
  status-pill:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
---

# Design System: Gorilla Grading · Panel del laboratorio

## Overview

**Creative North Star: "Banco de calibración" (versión mínima de empresa)**

El panel interno (/admin) sigue siendo el banco de medida del laboratorio, pero dicho en voz baja. Un carril blanco a la izquierda, un lienzo neutro casi blanco, hojas blancas con filetes finos, y una sola tinta casi negra que hace de botón principal, foco y selección. El color aparece solo cuando significa algo: rojo cuando un pedido va tarde, ámbar cuando vence ya, y el verde Gorilla queda reducido al escudo y al punto de "entregado".

El orden de lectura es fijo: una frase con lo que toca hoy, la línea del laboratorio con todo lo que está en marcha, y la cola de trabajo de quien entra, agrupada por acción y con un botón por tarea. Los títulos van en frase; las cifras son tabulares y los códigos van en mono. El panel es siempre claro; se usa en un laboratorio iluminado. Rechaza el dashboard de tarjetas de colores con iconos y saludos.

Este mundo cubre solo el panel interno. La web pública (`/`, cuenta del cliente, verificador) conserva su propio aspecto y no hereda estas reglas.

**Key Characteristics:**
- Carril blanco de 248 px con filete derecho, grupos "Laboratorio" / "Dirección" y contadores en mono apagado.
- Barra superior de 60 px sobre el lienzo (95% con desenfoque): ruta en migas y buscador con atajo "/".
- Hojas blancas con filete de 1 px y esquinas de 8 px (10 px en las dos hojas grandes de Hoy).
- Una tinta (ink) para acción principal, foco y selección; color solo para tarde, aviso y entregado.
- Títulos en frase; mono solo para códigos y recuentos.
- Firma: la línea del laboratorio.

## Colors

Neutros cálidos casi blancos, una tinta y tres colores con significado.

### Primary
- **Tinta** (ink): texto principal, botón principal, anillo de foco, selección, caret, línea y estaciones de la línea del laboratorio, plazo en curso, marca de las gráficas. Su hover es ink-hover.

### Secondary (colores con significado)
- **Tarde** (late): pedidos fuera de plazo (rayitas, cifras, títulos de grupo urgentes), cancelado, errores.
- **Aviso** (warn): vence hoy o mañana, en pausa, pago pendiente.
- **Verde Gorilla** (gorilla-green): solo el escudo del carril y el punto de "entregado". **Positivo** (positive) para cifras que suben en Negocio.

### Neutral
- **Lienzo** (canvas): fondo de página y de la barra superior; hover del carril; cabecera de tabla.
- **Hoja** (sheet): carril, hojas, campos. **Fila en hover** (row-hover).
- **Lavado** (wash): elemento activo del carril, separadores entre tareas y filas, bandeja de filtros de Hoy. **Bandeja segmentada** (segment-tray): bandeja del control de estados en Pedidos.
- **Filete** (fillet): bordes de hoja, carril, barra superior. **Trazo de campo** (field-stroke): campos, botones de contorno, tecla "/". **Pista** (track): parte vacía de la barra de plazo.
- **Tinta suave** (ink-soft): texto del carril, códigos. **Apagado** (muted): texto secundario. **Tenue** (faint): placeholder, iconos del carril, contadores, "sin empezar". **Inactivo** (idle): cifras a cero, separadores de migas, scrollbar. **Punto cerrado** (closed-dot): borrador y devuelto.

### Named Rules
**The One Ink Rule.** La acción principal, el foco y la selección son tinta. El verde no es el color de acción.

**The Meaning Only Rule.** Un color que no sea tinta o neutro tiene que decir tarde, aviso o entregado. Nada más se colorea.

**The Fixed Scale Rule.** El plazo se dice siempre igual: tinta en plazo, ámbar si vence hoy o mañana, rojo si va tarde.

## Typography

**Display Font:** Archivo Variable (con Archivo, system-ui)
**Body Font:** Archivo Variable, con `font-feature-settings: 'tnum' 1` y suavizado antialiased en todo el panel
**Label/Mono Font:** JetBrains Mono 400/600 (con ui-monospace)

**Character:** Una sola familia sobria, en pesos 400-600, con tracking negativo solo en las cifras grandes. El mono marca lo que hay que leer exacto: el número de pedido (en grupos de tres, "713 209 782") y los recuentos.

### Hierarchy
- **Display** (600, 30px, 1.1, -0.02em): la frase titular de Hoy ("5 tareas para hoy").
- **Station count** (600, 22px, -0.02em): recuento de cada estación; a cero en idle.
- **Headline** (600, 15px): título de la página en la barra superior, tras la ruta.
- **Title** (600, 13px): título de hoja ("Línea del laboratorio", "Cola de trabajo"); 12.5px para grupos de la cola, en rojo si son urgentes.
- **Body** (400-600, 14px): nombre de la tarea o del cliente (600), tablas; 13-13.5px para datos de apoyo y estados.
- **Body small** (12.5px / 12px): detalles bajo cada nombre, nombres de estación, cabeceras de tabla (12px 600 apagado, en frase).
- **Code** (JetBrains Mono, 12.5px): número de pedido en la cola; 14px 600 en la tabla de Pedidos.
- **Count** (JetBrains Mono, 11-11.5px): contadores del carril, de segmentos y de grupos, n/7 del estado.

### Named Rules
**The Sentence Case Rule.** Títulos, cabeceras de tabla y rótulos van en frase, en la familia de texto. No hay rótulos en mayúsculas ni en mono.

## Layout

En ordenador (≥ 1024px): rejilla `248px | 1fr`; el carril es sticky a toda altura. Por debajo, cajón de 260 px (máx. 80vw) sobre velo negro al 40%, con su propio botón de cerrar.

Barra superior de 60 px, sticky, con migas ("Laboratorio / Pedidos / Pedido …") y buscador de máx. 320 px a la derecha. `main` con ancho máximo 1280 px, padding horizontal 16 / 24 / 40 px y 32 px vertical; los bloques de Hoy se separan 32 px.

Cola de trabajo: cada tarea es una fila `112px | 1.2fr | 1fr | 140px | auto` (código, nombre y detalle, cliente, plazo, botón) con padding 20 × 10 px; en móvil pasa a nombre + botón, con el plazo debajo. Pedidos: control segmentado, buscador de 340 px y tabla con columna Plazo de 210 px.

## Elevation & Depth

Plano. La profundidad viene del contraste lienzo / hoja y de filetes de 1 px. La única sombra en reposo es la que levanta el segmento elegido sobre su bandeja; el resto son capas flotantes.

### Shadow Vocabulary
- **Segmento elegido** (`box-shadow: 0 1px 2px rgba(15,17,16,0.08)`): segmento activo de los controles segmentados.
- **Cajón** (`box-shadow: 8px 0 24px rgba(15,17,16,0.18)`): carril abierto en tablet y móvil.
- **Diálogo** (`shadow-2xl` de Tailwind) y **tooltip** (`shadow-lg`): diálogo de acción del detalle y tooltip de las gráficas.

### Named Rules
**The Flat Sheet Rule.** Las hojas no llevan sombra. Para separar, filete o lienzo.

## Shapes

Esquinas suaves y escalonadas por tamaño: hojas a 8 px (10 px en las dos hojas grandes de Hoy), campos y bandejas segmentadas a 7-8 px, botones de fila, elementos de navegación y segmentos a 6 px (5 px dentro de la bandeja de Hoy), tecla de atajo a 4 px. Los puntos de estado, las estaciones y el avatar de iniciales son círculos. Las barras (plazo y rayitas) son trazos de 3 px.

## Components

### Buttons
- **Shape:** 6 px en botones de tarea; 7-8 px en botones de barra (Actualizar, paginar).
- **Primary (tinta):** fondo tinta, texto blanco 600 12.5px, 28 px de alto; hover ink-hover. En la cola, solo las acciones que avanzan el pedido (Corregir, Subir PDF, Revisar, Aprobar salida, Abrir lo que va tarde).
- **Outline:** hoja con trazo de campo, texto tinta; hover endurece el borde a tinta. El resto de acciones.
- **Text link:** apagado, pasa a tinta y subraya (offset 4 px) al hover.
- **Focus:** contorno de 2 px tinta, offset 2 px. Disabled: opacidad 40-60%.

### Segmented control
- **Style:** bandeja (wash en Hoy, segment-tray en Pedidos) con 2 px de padding; segmentos en texto apagado con recuento mono.
- **State:** el elegido es hoja blanca, texto tinta 600 y la sombra de segmento. Sirve para filtrar la cola y para elegir el estado en Pedidos.

### Cards / Containers (hojas)
- **Corner Style:** 8 px; 10 px en Línea del laboratorio y Cola de trabajo.
- **Background:** blanco sobre lienzo.
- **Shadow Strategy:** ninguna.
- **Border:** filete de 1 px; separadores internos en wash.
- **Internal Padding:** cabecera 20 × 14 px con filete inferior; línea del laboratorio 20-28 px.

### Inputs / Fields
- **Style:** hoja, trazo de campo, 7-8 px, texto 13-14px, placeholder tenue, icono de lupa a la izquierda; el buscador superior lleva la tecla "/" a la derecha.
- **Focus:** borde tinta y halo de 2 px tinta al 10%.

### Navigation (carril)
- **Style:** blanco con filete derecho; cabecera de 60 px con escudo y "Gorilla Grading" (14px 600).
- **Items:** 34 px, 13.5px, icono de línea de 16 px en tenue; hover a lienzo y texto tinta; contador mono 11.5px tenue a la derecha.
- **Active:** fondo wash, texto e icono tinta, 600.
- **Grupos:** "Dirección" con título 11.5px tenue, en frase.
- **Pie:** avatar circular de iniciales en tinta, nombre y rol, botones de icono 28 px para "Ver la web" y "Cerrar sesión".

### Status Pill
Punto de 7 px y el nombre del estado en 13px; en el recorrido normal, la estación en mono tenue 11px ("3/7"). El punto es tinta en el recorrido normal; ámbar en pausa o pago pendiente, rojo cancelado, verde entregado, gris en borrador y devuelto. Sin caja ni fondo.

### Plazo
Barra de 56 × 3 px redondeada sobre pista, rellena con la parte consumida del plazo (entera si va tarde), y al lado el plazo en palabras 13px: "6 días", "Mañana", "Hoy", "+2 días". Tinta en plazo, ámbar y 600 si vence hoy o mañana, rojo y 600 si va tarde. Sin fechas: "Sin empezar" o "Espera hace N días" en tenue; en pausa, "Detenido" en ámbar.

### Línea del laboratorio (firma)
Hoja grande con siete estaciones (Por recibir → Enviado) colgadas de una sola línea de tinta de 1 px. Cada estación: recuento station-count arriba, una rayita de 3 × 14 px por pedido (máx. 14, luego "+N" en mono), la estación como círculo de 9 px con borde tinta (lleno si tiene pedidos, hueco si no, crece al hover) y su nombre debajo en 12px. Los pedidos que van tarde son rayitas rojas de 18 px y suman " · N tarde" en rojo al nombre. Cada estación lleva a Pedidos filtrado por ese estado.

## Do's and Don'ts

### Do:
- **Do** consumir `usePanelTheme()` y las constantes `INK`, `LATE`, `WARN` en cualquier pantalla nueva del panel.
- **Do** usar tinta para la acción principal y contorno para el resto; un botón de acción por tarea, alineado a la derecha.
- **Do** escribir títulos, cabeceras y rótulos en frase.
- **Do** poner números de pedido (en grupos de tres) y recuentos en JetBrains Mono, con cifras tabulares en todo.
- **Do** decir el plazo con la barra compacta y palabras, en la escala tinta / ámbar / rojo.
- **Do** mostrar pausas y cancelaciones; nunca ocultarlas.

### Don't:
- **Don't** usar el verde Gorilla para botones, enlaces o estados que no sean "entregado".
- **Don't** colorear estados de la ruta normal; van en tinta.
- **Don't** poner rótulos en mayúsculas ni rótulos en mono sobre títulos o campos.
- **Don't** dar sombra a las hojas.
- **Don't** construir tarjetas de colores con icono grande y saludo; Hoy abre con la frase, la línea y la cola.
- **Don't** traer el aspecto de la web pública (menú, pie, fondos crema) al panel.
