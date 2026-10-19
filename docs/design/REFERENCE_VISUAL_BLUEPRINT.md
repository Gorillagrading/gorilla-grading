# GORILLA GRADING — REFERENCE VISUAL BLUEPRINT
**Ingeniería Inversa Visual, Especificación Técnica y Desglose Anatómico de la Composición de Referencia**

---

## 1. INTRODUCCIÓN Y PROPÓSITO DEL DOCUMENTO

Este documento constituye la **especificación visual maestra** obtenida a partir de la ingeniería inversa exhaustiva de la imagen de referencia de Gorilla Grading (`media_1790083815678.jpg`).

Su objetivo es fijar de forma medible, proporcional, cromática y compositiva cada milímetro de la interfaz para su posterior implementación técnica. **No es una interpretación libre ni una aproximación conceptual:** es la traducción sistemática del diseño de alta fidelidad a parámetros de diseño y maquetación web precisos.

---

## 2. ANÁLISIS DE LA COMPOSICIÓN GENERAL Y SISTEMA RETICULAR

### 2.1 Formato del Canvas y Proporciones Macro
- **Aspect Ratio de Referencia:** ~1:1.95 (Lienzo vertical continuo de landing page completa para desktop de 1440px a 1600px de ancho base).
- **Estructura en 5 Bandas Horizontales:**
  1. **Banda 0 — Header / Navigation Bar:** 0.0% a 3.8% de la altura total.
  2. **Banda 1 — Cinematic Hero Canvas:** 3.8% a 44.2% de la altura total.
  3. **Banda 2 — Brand Ecosystem Ribbon:** 44.2% a 51.0% de la altura total.
  4. **Banda 3 — Section 02: Optical Technology:** 51.0% a 70.8% de la altura total.
  5. **Banda 4 — Section 03: Editorial Core Pillars:** 70.8% a 88.5% de la altura total.
  6. **Banda 5 — Section 04: Institutional Mission Banner:** 88.5% a 100.0% de la altura total.

### 2.2 Sistema de Rejilla (Grid System)
- **Grid Container:** Ancho máximo acotado a `1400px` (en pantallas ultra-wide), centrado con márgenes exteriores flexibles (`margin: 0 auto`).
- **Columnas:** Sistema base de **12 columnas** simétricas con canaletas (*gutters*) de `32px` a `40px` y márgenes laterales (*padding horizontal*) de `48px` a `64px` en desktop estándar (`1440px`).
- **Eje de Simetría Asimétrico (Offset Dynamic):**
  - En el **Hero**: La división espacial no es un 50/50 frío; es un **46% / 54%**. La tipografía ocupa el 46% izquierdo (columnas 1 a 6) y el centro de gravedad óptico (ojo del gorila + slab flotante sobre pedestal) ocupa el 54% derecho (columnas 6 a 12), generando tensión visual y profundidad sin colisión de masas.

---

## 3. INGENIERÍA INVERSA DETALLADA POR SECCIÓN

```
+--------------------------------------------------------------------------------------------------+
| [G] GORILLA GRADING      Grading   Technology   Collectors   Pricing   About       (Q) [EN v] [Submit] | Header (H: ~80px)
+--------------------------------------------------------------------------------------------------+
| CARDS DESERVE BETTER                                     |                   | M                 |
| PRECISION                                         [ GORILLA HEAD ]           | O                 | Hero
| GIVES VALUE                                     (Studio Low-Key Eye)         | R  | A HIGHER     | (H: ~90vh)
| Professional card grading powered by...                  |                   | E    STANDARD     |
| [Start Submission ->]  See Tech (>)               [ GRADED SLAB: 10 ]        | T                 |
| (oo)(oo) Trusted by collectors | 4.9/5 *****       (Charizard ex)            | H  [SEAL STAMP]   |
| TCG // SPORTS // COLLECTIBLES                     [ STONE BASALT PLINTH ]    | A                 |
|                                                   (COLLECT PRESERVE VALUE)   | N                 |
+--------------------------------------------------------------------------------------------------+
| TRUSTED BY COLLECTORS, STORES AND COMMUNITIES                                                     | Brand Ribbon
| [Pokemon]      [Magic]      [One Piece]      [Lorcana]      [Topps]      [Panini]      AND MORE ->| (#EAE8E3)
+--------------------------------------------------------------------------------------------------+
| TECHNOLOGY THAT REVEALS THE REAL STORY    [SCAN]     [ANALYZE]    [MEASURE]    [GRADE]   - CENTERING | Tech Section
| High-resolution imaging, advanced...      (Color)    (Defects)    (Grid Cal)   (Slab)    - CORNERS   | (H: ~700px)
| EXPLORE THE PROCESS (->)                  ------------------------------------ Laser     - EDGES     |
|                                                                                          - SURFACE   |
|                                                                                          - AUTHENTIC |
+--------------------------------------------------------------------------------------------------+
| +-------------------+ +-------------------+ +-------------------+ +-------------------+          | 4 Pillars
| | [PHOTO: WELD] [v] | | [PHOTO: ROSETTE]  | | [PHOTO: PRISM]    | | [PHOTO: CROWD]    |          | Cards
| | PRESERVE          | | AUTHENTICATE      | | UNDERSTAND        | | BELONG            |          | (#121613)
| | Long-term prot... | | Advanced anal...  | | A clear expla...  | | A growing comm... |          |
| | LEARN MORE ->     | | LEARN MORE ->     | | LEARN MORE ->     | | LEARN MORE ->     |          |
| +-------------------+ +-------------------+ +-------------------+ +-------------------+          |
+--------------------------------------------------------------------------------------------------+
| FOR A STRONGER        We believe in a transparent, accessible and       +------------------+     | Mission Banner
| COLLECTING FUTURE     trustworthy collectibles market. Gorilla...       | OUR MISSION   -> |     | (Dark Green)
|                                                                         +------------------+     |
+--------------------------------------------------------------------------------------------------+
```

---

### SECCIÓN 0: HEADER / NAVBAR

#### Parámetros Medibles:
- **Altura fija:** `80px` (desktop), con reducción sutil a `72px` en scroll con fijación adhesiva (*sticky*).
- **Fondo:** Translúcido negro grafito `#0A0D0B` con opacidad del `85%`, filtro de desenfoque de fondo (*backdrop-filter*) de `16px` a `20px` (`blur-md/lg`).
- **Borde inferior:** Línea de separación microscópica de `1px` sólida: `rgba(255, 255, 255, 0.07)`.
- **Estructura en 3 Bloques:**
  1. **Bloque Izquierdo — Brand Identity (Columna 1-3):**
     - Icono: Escudo heráldico facetado en verde esmeralda institucional (`#48C765`), dimensiones `34px x 34px`.
     - Logotipo Tipográfico: "GORILLA GRADING" en mayúsculas sostenidas, fuente sans-serif geométrica pesada, `14px`, tracking `0.18em` (espaciado generoso entre caracteres), color blanco sólido `#FFFFFF`.
  2. **Bloque Central — Menú de Navegación Principal (Columnas 4-9):**
     - 5 enlaces de texto: `Grading`, `Technology`, `Collectors`, `Pricing`, `About`.
     - Tipografía: Sans-serif limpia de alta legibilidad (*Inter* o *Plus Jakarta Sans*), `13.5px`, peso 500 (Medium), color inactivo `#8A9187` (gris neutro mineral), hover con transición a `#FFFFFF`.
     - Separación (*gap*) entre elementos: `36px` equidistantes.
  3. **Bloque Derecho — Utilidades y Conversión (Columnas 10-12):**
     - Icono de búsqueda: Lupa vectorial minimalista de trazo fino (`stroke-width: 1.8px`), color `#8A9187`, hover `#FFFFFF`.
     - Selector de Idioma: `EN ⌵` (o `ES ⌵`), `12px`, tipografía monoespaciada/técnica (*JetBrains Mono*), con chevron discreto de 3x3px.
     - Botón `Submit a Card`: Botón de silueta (*outline capsule*), `rounded-full` (radio `9999px`), borde de `1px` sólido `rgba(255, 255, 255, 0.22)`, fondo transparente, padding horizontal `22px`, vertical `9px`, texto en `12.5px` peso 600, color `#FFFFFF`, hover con borde `#48C765` y sutil brillo perimetral.

---

### SECCIÓN 1: HERO SECTION (CINEMATIC CANVAS)

#### 1. Fondo Atmosférico y Tratamiento del Gorila
- **Posición del Gorila:** Ubicado en el tercio medio-derecho del canvas. El centro de su rostro está a un `52%` horizontal y un `24%` vertical respecto a la esquina superior izquierda.
- **Escala:** Escala monumental pero encuadrada con dramatismo (solo cabeza, ceño, puente nasal y ojo izquierdo visibles con nitidez; el resto se pierde en sombra).
- **Iluminación (Estilo Low-Key / Rembrandt Studio):**
  - **Luz Clave (Key Light):** Luz cenital/rasante fría que perfila la textura de las arrugas en la frente y el pómulo izquierdo.
  - **Luz de Acento Focal (Catchlight):** El iris del gorila está iluminado con un destello ámbar/verde esmeralda intenso, mirando fijamente al usuario, ubicado exactamente en la línea visual superior del titular `VALUE`.
  - **Degradado de Transición Izquierda (Falloff):** Hacia la izquierda (desde el 48% hacia el 0% de ancho), el pelaje negro se funde de manera gradual y 100% continua en el color de fondo base `#0A0D0B`. **No existe ninguna costura, borde recortado ni corte de lienzo.**

#### 2. La Losa Graduada (The Slab) y el Pedestal de Basalto
- **Posición del Slab:** Primer término (*foreground*), ubicado entre el `58%` y el `85%` del ancho horizontal, y entre el `6%` y el `38%` vertical.
- **Ángulo y Perspectiva:** Prácticamente frontal con una ligera desviación angular de 1.5° a 2° que revela el biselado acrílico izquierdo y superior.
- **Materialidad de la Losa:**
  - Acrílico óptico cristalino ultratransparente con reflejos especulares nítidos en los bordes biselados.
  - Etiqueta superior interna: Fondo negro carbón mate, logo Gorilla Grading en blanco a la izquierda, nota **`10`** masiva a la derecha en tipografía grotesca bold, subtítulo `GEM MINT` debajo de la nota, código QR criptográfico a la derecha, detalles de la carta (2023 POKÉMON / CHARIZARD ex / SPECIAL ILLUSTRATION RARE / #10214) justificados a la izquierda en blanco níveo.
  - Carta en el interior: *Charizard ex* con arte alternativo en tonos cálidos (naranjas fuego, azules y amarillos), creando un punto de atracción focal cromático cálido en medio del entorno frío y oscuro.
- **Pedestal (The Basalt Plinth):**
  - Base sólida de piedra volcánica/basalto negro natural con aristas rústicas y fracturas realistas.
  - Altura: aproximadamente `110px` en viewport desktop.
  - Inscripción en bajorrelieve en la cara frontal plana:
    ```
    COLLECT
    PRESERVE
    VALUE
    ```
  - Tipografía cincelada con textura de piedra, espaciada, en tono gris mineral claro con sombras interiores.

#### 3. Regla Editorial y Margen Derecho
- Ubicado entre el `89%` y el `95%` del ancho de la pantalla.
- **Línea Vertical:** Guía milimétrica de `1px` en `rgba(255, 255, 255, 0.15)`.
- **Tipografía Vertical / Tracking Extremo:**
  - `MORE` / `THAN` / `A GRADE` (distribuido verticalmente).
  - Separador de guión o línea vertical.
  - `A HIGHER` / `STANDARD`.
  - Letra `9px`, `font-mono`, tracking `0.3em`, mayúsculas sostenidas, color `#8A9187`.
- **Sello Circular Embosado (Seal of Authenticity):**
  - Diámetro: `72px`.
  - Fondo transparente, doble anillo perimetral concéntrico de `1px`, texto circular grabado en arco ("EUROPEAN GRADING STANDARD • EST. 2024"), silueta central de la marca grabada en bajorrelieve oscuro.

#### 4. Columna Tipográfica Izquierda (Titulares, Copy, CTAs y Trust)
- **Alineación:** Todas las líneas están alineadas estrictamente al margen izquierdo de la columna 1 (`padding-left: 0` relativo al contenedor de 1400px).
- **Kicker Superior:**
  - Texto: `CARDS DESERVE BETTER`
  - Tipografía: Monospace técnica (*JetBrains Mono*), `11.5px`, peso 600, tracking `0.26em`, color gris mineral `#8A9187`.
  - Margen inferior: `24px`.
- **Titular Display Masivo:**
  - Línea 1: `PRECISION` (Blanco `#FFFFFF`)
  - Línea 2: `GIVES ` (Blanco `#FFFFFF`) + `VALUE` (Verde Esmeralda `#48C765`)
  - Tipografía: Sans-serif ultra-pesada (Black 900), condensada geométrica (*Syne 800/900* o *Cabinet Grotesk ExtraBold*).
  - Tamaño: `76px` a `82px` en desktop.
  - Interlineado (*Line Height*): `0.88` a `0.90` (las líneas casi se tocan, transmitiendo solidez monolítica sin espacios vacíos).
  - Letter-spacing: Negativo acentuado (`-0.035em` a `-0.04em`).
  - Margen inferior: `28px`.
- **Párrafo Descriptivo:**
  - Texto: *"Professional card grading powered by advanced technology and expert analysis. Authenticity. Transparency. Trust."*
  - Tamaño: `17px`, peso 400 (Regular), color `#8A9187`, max-width `490px`, interlineado `1.65`.
  - Margen inferior: `36px`.
- **Fila de CTAs (Acciones de Conversión):**
  - **Botón Primario (`Start Your Submission`):**
    - Fondo: Verde esmeralda sólido `#48C765`.
    - Texto: Negro carbón `#0A0D0B`, `14px`, peso 700 (Bold).
    - Silueta: Píldora completa (`rounded-full`), padding `16px 32px`.
    - Icono: Flecha limpia `→` en negro carbón con `4px` de separación.
    - Sombra: Resplandor verde tenue difuminado `0 10px 30px rgba(72, 199, 101, 0.28)`.
  - **Botón Secundario (`See Our Technology`):**
    - Fondo: 100% transparente.
    - Disposición: El texto va primero (`14px`, peso 600, blanco `#FFFFFF`), y a su derecha se ubica un botón circular de `30px x 30px` con borde fino blanco de `1px` conteniendo el icono de reproducción triangular `▶` en blanco.
    - Separación del botón primario: `28px`.
  - Margen inferior del bloque de botones: `44px`.
- **Tira de Prueba Social y Confianza (Social Proof Strip):**
  - Separador superior: Línea horizontal de `1px` en `rgba(255, 255, 255, 0.08)`, ancho `460px`.
  - Padding superior: `24px`.
  - **Avatares:** 4 fotografías circulares de coleccionistas reales superpuestas (*negative margin* de `-8px`), diámetro `32px` cada una, con aro perimetral exterior de `2px` sólido en `#0A0D0B` para separarlas netamente.
  - Texto adyacente: `Trusted by collectors all over Europe` (12px, regular, color `#8A9187`).
  - Calificación: `4.9/5` en blanco bold `14px`, acompañado de 5 estrellas compactas en verde esmeralda `★★★★★` (`11px`), seguido del texto `From 2,500+ submissions` (`12px`, gris `#8A9187`).
- **Ticker Inferior:**
  - Texto: `TCG  //  SPORTS  //  COLLECTIBLES`
  - Posición: `36px` por debajo de la prueba social.
  - Tipografía: Monospace, `10.5px`, tracking `0.22em`, color `#52584F` (verde grisáceo apagado).

---

### SECCIÓN 2: CINTA DE ECOSISTEMA & MARCAS (BRAND RIBBON)

#### Parámetros Medibles:
- **Altura total de la banda:** `110px` a `125px`.
- **Fondo:** Beige / Gris piedra cálido texturizado con grano microscópico: `#EAE8E3` (contraste tonal intencional contra los fondos negros superior e inferior).
- **Bordes:** Línea superior e inferior de `1px` sólida en tono piedra sombreada: `#D3D0C7`.
- **Kicker de Encabezado Superior:**
  - Texto: `TRUSTED BY COLLECTORS, STORES AND COMMUNITIES`
  - Posición: Justificado a la izquierda, alineado exactamente con la columna 1 (`padding-left: 0`).
  - Tipografía: Monospace técnica, `9.5px`, mayúsculas sostenidas, tracking `0.24em`, color gris piedra oscuro `#70756D`.
  - Margen inferior: `14px`.
- **Hilera de Logotipos de Marcas:**
  - Disposición: Flexbox horizontal distribuido uniformemente a lo ancho del contenedor de 1400px (`justify-between`), con alineación vertical centrada.
  - **Tratamiento Cromático:** 100% monocromático en negro grafito suave / carbón (`#1C201D`). Sin colores corporativos estridentes de terceros; todas las marcas se unifican bajo la identidad editorial del sitio.
  - **Logos incluidos en la referencia:**
    1. `Pokémon` (wordmark oficial con trazo distintivo).
    2. `Magic: The Gathering` (símbolo planeswalker + tipografía romana).
    3. `One Piece Card Game` (emblema con calavera + tipografía bold).
    4. `Disney Lorcana` (script cursivo Disney + serif Lorcana con destello).
    5. `Topps` (cursiva clásica inclinada con loop).
    6. `Panini` (caja rectangular enmarcada con bloque mayúsculo).
    7. `AND MORE →` (enlace tipográfico institucional en `10px`, monospace, gris `#70756D`).

---

### SECCIÓN 3: TECNOLOGÍA ÓPTICA (TECHNOLOGY THAT REVEALS THE REAL STORY)

#### 1. Cabecera y Columna Izquierda
- **Titular Display:**
  - Texto:
    ```
    TECHNOLOGY
    THAT REVEALS
    THE REAL STORY
    ```
  - Tipografía: Sans-serif ultra-bold (Black 900), `52px` a `58px`, tracking `-0.03em`, interlineado `0.94`, color blanco puro `#FFFFFF`.
  - Ancho de columna: Ocupa las columnas 1 a 4 (~34% del ancho del grid).
- **Párrafo Descriptivo:**
  - *"High-resolution imaging, advanced analysis and expert review. Every detail matters."*
  - Tamaño `16px`, gris `#8A9187`, max-width `380px`, interlineado `1.6`.
  - Margen inferior: `28px`.
- **Enlace de Acción Técnico:**
  - `EXPLORE THE PROCESS` subrayado en verde `#48C765`, seguido de un icono circular con flecha `(→)`.
  - Tipografía: Monospace bold `11px`, tracking `0.2em`, color `#48C765`.

#### 2. Composición Central de 4 Cartas en Perspectiva 3D (The 4-Stage Isometric Cascade)
- **Disposición Espacial:**
  - Ocupa las columnas 5 a 10 (~52% del ancho del grid).
  - 4 cartas idénticas en dimensiones proporcionales (proporción estándar de tarjeta coleccionable 2.5 x 3.5 pulgadas), orientadas con una inclinación en perspectiva isométrica idéntica (rotación en Y de aproximadamente 22° y rotación en X de 4°).
  - Están escalonadas horizontalmente con solapamiento espacial (*depth layering*): la carta 1 está al frente, la carta 2 detrás, la 3 más atrás y la 4 a la derecha.
- **Los 4 Estados del Escaneo:**
  1. **Fase 1 (`SCAN`):**
     - Carta Charizard a todo color, con una línea láser horizontal cian/verde en el tercio superior indicando captura en curso.
  2. **Fase 2 (`ANALYZE`):**
     - Fotografía microscópica invertida en blanco y negro (mapa de reflectancia especular / campo oscuro), donde se observan las microfibras del cartón, la trama de roseta de impresión y el relieve topográfico de la superficie.
  3. **Fase 3 (`MEASURE`):**
     - Malla reticular técnica de calibre láser (cuadrícula azul cian de 0.01mm) superpuesta sobre la carta con vectores de medición en esquinas y diagonales de centrado.
  4. **Fase 4 (`GRADE`):**
     - El producto final: el Slab acrílico sellado herméticamente, con la etiqueta de calificación 10 GEM MINT, reflejando luz de estudio en sus bordes biselados.
- **Infraestructura de Datos y Líneas Guía:**
  - Encima de cada carta, centrado con su eje vertical, se encuentra su etiqueta en monospace mayúscula `SCAN`, `ANALYZE`, `MEASURE`, `GRADE` (`10.5px`, color blanco/verde).
  - Una línea vertical finísima de `1px` desciende desde cada etiqueta hasta el borde superior de la carta correspondiente.
  - Una línea láser horizontal continua conecta visualmente las 4 etapas a media altura, simbolizando el flujo continuo de inspección óptica.

#### 3. Columna Derecha de Telemetría (Checklist)
- **Posición:** Columnas 11 y 12 (~14% del ancho del grid), alineada verticalmente al centro de la composición de cartas.
- **Separador Izquierdo:** Línea vertical tenue de `1px` en `rgba(255, 255, 255, 0.08)`.
- **Elementos de la Lista:**
  - `— CENTERING`
  - `— CORNERS`
  - `— EDGES`
  - `— SURFACE`
  - `— AUTHENTICITY`
- **Tipografía:** Monospace técnica (*JetBrains Mono*), `11.5px`, mayúsculas sostenidas, tracking `0.22em`, color blanco apagado `#E0E4DE`, con el guión inicial `—` coloreado en verde esmeralda `#48C765`.
- **Separación vertical entre ítems:** `18px`.

---

### SECCIÓN 4: PILARES EDITORIALES (PRESERVE, AUTHENTICATE, UNDERSTAND, BELONG)

#### Parámetros Medibles:
- **Estructura:** Cuadrícula simétrica de 4 tarjetas (`grid-cols-4`), con separación (*gap*) de `24px`.
- **Dimensiones de Tarjeta:**
  - Ancho individual: ~`320px` a `330px`.
  - Altura total: ~`420px`.
- **Estilo del Contenedor de Tarjeta:**
  - Fondo: Negro grafito pulido `#121613`.
  - Bordes: Perímetro de `1px` sólido en `rgba(255, 255, 255, 0.07)`.
  - Radio de curvatura (*Border Radius*): `16px` (`rounded-2xl`).
- **Bloque Fotográfico Superior (Altura: `200px`):**
  - **Tarjeta 1 (`PRESERVE`):** Macrofotografía del borde del slab acrílico transparente sellado ultrasónicamente, mostrando la costura hermética y un discreto icono vectorial de escudo contorneado en blanco en la esquina inferior izquierda.
  - **Tarjeta 2 (`AUTHENTICATE`):** Fotografía microscópica de textura forense de alta resolución mostrando la roseta de puntos de tinta offset y el grano del papel bajo luz UV/rasante.
  - **Tarjeta 3 (`UNDERSTAND`):** Macrofotografía del bisel de una esquina de slab acrílico premium refractando la luz con destello prismático y acabado pulido de diamante.
  - **Tarjeta 4 (`BELONG`):** Fotografía real de una gran convención de cartas coleccionables en Europa, capturando la multitud de coleccionistas, stands y atmósfera comunitaria en blanco y negro / baja saturación cálida.
- **Bloque Tipográfico Inferior (Padding interior `24px`):**
  - **Título:** Fuente sans-serif display bold 800, `19px`, tracking `-0.01em`, mayúsculas sostenidas, color blanco `#FFFFFF`.
  - **Descripción:** Fuente sans-serif regular 400, `13px`, color gris `#8A9187`, interlineado `1.55`.
    - P1: *"Long-term protection for what you love."*
    - P2: *"Advanced analysis against fakes."*
    - P3: *"A clear explanation for every grade."*
    - P4: *"A growing community across Europe."*
  - **Enlace de Acción:** `LEARN MORE →` en tipografía monospace `11px`, tracking `0.18em`, color verde esmeralda `#48C765`, con flecha direccional.

---

### SECCIÓN 5: BANNER DE MISIÓN INSTITUCIONAL (FOR A STRONGER COLLECTING FUTURE)

#### Parámetros Medibles:
- **Altura de la sección:** ~`160px` a `180px`.
- **Fondo:** Verde bosque profundo texturizado (`#0D1A10` a `#071209`) con una trama de grano orgánico en modo de fusión *overlay* al `30%` de opacidad, y un resplandor ambiental esmeralda muy tenue en la esquina inferior derecha.
- **Borde superior:** Línea de separación de `1px` sólida en `rgba(255, 255, 255, 0.08)`.
- **Disposición en 3 Bloques:**
  1. **Bloque Izquierdo (Columna 1-5):**
     - Titular: `FOR A STRONGER` / `COLLECTING FUTURE` en mayúsculas sostenidas, sans-serif display bold 900, `34px` a `38px`, color blanco sólido `#FFFFFF`, interlineado `0.98`.
  2. **Bloque Central (Columna 6-9):**
     - Párrafo filosófico: *"We believe in a transparent, accessible and trustworthy collectibles market. Gorilla Grading is built for collectors, by collectors, with a long-term vision."*
     - Tipografía: Sans-serif regular, `13px` a `14px`, color verde salvia pálido `#A2B5A5`, interlineado `1.6`.
  3. **Bloque Derecho (Columna 10-12, alineado a la derecha):**
     - Botón `OUR MISSION →`:
       - Forma: Rectángulo con esquinas suavizadas (`rounded-lg`, radio `8px`).
       - Dimensiones: `padding: 14px 26px`.
       - Bordes: `1px` sólido en verde esmeralda `rgba(72, 199, 101, 0.45)`.
       - Fondo: Negro carbón semitransparente `rgba(0, 0, 0, 0.35)`.
       - Texto: Monospace bold `11.5px`, tracking `0.22em`, mayúsculas sostenidas, color `#FFFFFF` con flecha `→` en `#48C765`.

---

## 4. ANÁLISIS CROMÁTICO, ILUMINACIÓN Y MATERIALIDAD

### 4.1 Paleta Cromática Exacta (Design Tokens)

| Token Semántico | Código HEX | Espacio RGB | Uso en la Composición |
|---|---|---|---|
| **Base Canvas** | `#0A0D0B` | `rgb(10, 13, 11)` | Fondo general de la página, Hero y Sección de Tecnología. |
| **Surface Dark** | `#121613` | `rgb(18, 22, 19)` | Fondo de tarjetas de los 4 Pilares y paneles. |
| **Surface Dark Elevated** | `#161B16` | `rgb(22, 27, 22)` | Contenedor de inputs y modales. |
| **Brand Accent Green** | `#48C765` | `rgb(72, 199, 101)` | Palabra `VALUE`, botón primario, destellos láser, enlaces `LEARN MORE`. |
| **Brand Accent Hover** | `#38B554` | `rgb(56, 181, 84)` | Estado hover del botón primario de envío. |
| **Brand Green Dark** | `#0D1A10` | `rgb(13, 26, 16)` | Fondo del banner de misión inferior. |
| **Text Primary** | `#FFFFFF` | `rgb(255, 255, 255)` | Titulares display principales, notas 10, botones. |
| **Text Muted Neutral** | `#8A9187` | `rgb(138, 145, 135)` | Párrafos descriptivos, labels secundarios, kickers. |
| **Text Muted Subtle** | `#52584F` | `rgb(82, 88, 79)` | Tickers técnicos (`TCG // SPORTS // COLLECTIBLES`). |
| **Ribbon Sand Light** | `#EAE8E3` | `rgb(234, 232, 227)` | Fondo de la cinta de marcas (Brand Ribbon). |
| **Ribbon Brand Ink** | `#1C201D` | `rgb(28, 32, 29)` | Logotipos monocromáticos sobre el fondo piedra. |
| **Border Subtle** | `rgba(255,255,255,0.07)` | — | Separadores de sección, tarjetas de pilares, header. |

### 4.2 Iluminación y Sensación de Profundidad
- **Luz de Estudio Teatral (Chiaroscuro):** No hay luces planas ni iluminación artificial distribuida por igual. Hay un gradiente intencional de luz que emana desde el centro-derecha (el ojo del gorila y los bordes del slab) y decae exponencialmente hacia el negro puro en los bordes de la pantalla.
- **Specular Highlights (Reflejos Especulares):** El acrílico de los slabs presenta líneas de luz blanca dura de `1px` a `2px` con gradiente alfa en los cantos biselados, lo que transmite de inmediato la dureza y calidad óptica del plástico sin necesidad de explicaciones.
- **Sombras de Oclusión Ambiental:** Los slabs y el bloque de piedra no proyectan sombras borrosas convencionales; proyectan sombras de contacto profundas (`rgba(0, 0, 0, 0.95)`) muy ceñidas a la base, afianzando los objetos como elementos físicos reales de gran peso.

---

## 5. TIPOGRAFÍA Y JERARQUÍA EDITORIAL

### 5.1 Los Tres Niveles Tipográficos
1. **Familia Display / Titulares (Grotesque / Heavy Sans):**
   - **Personalidad:** Brutalista, monolítica, segura de sí misma, sin serifas ni ornamentos infantiles.
   - **Fuentes equivalentes:** *Syne* (peso 800/900), *Cabinet Grotesk* (Black), *Montserrat* (900 Black).
   - **Rasgos obligatorios:**
     - Mayúsculas sostenidas (`uppercase`).
     - Tracking negativo ceñido (`-0.03em` a `-0.04em`).
     - Line-height ultra compacto (`0.88` a `0.92`).
2. **Familia de Lectura / Body Copy (Neo-Grotesque Neutral):**
   - **Personalidad:** Cristalina, neutral, técnica y legible.
   - **Fuentes:** *Plus Jakarta Sans*, *Inter*.
   - **Rasgos obligatorios:**
     - Peso 400 (Regular) a 500 (Medium).
     - Color `#8A9187` para evitar el contraste excesivo del blanco puro que cansa la vista.
     - Interlineado relajado (`1.6` a `1.65`).
3. **Familia Técnica / Telemetría (Monospace Lab):**
   - **Personalidad:** Instrumento de laboratorio óptico, trazabilidad, precisión suiza.
   - **Fuentes:** *JetBrains Mono*, *Space Mono*.
   - **Rasgos obligatorios:**
     - Mayúsculas sostenidas con tracking amplio (`0.20em` a `0.30em`).
     - Uso estricto en kickers (`CARDS DESERVE BETTER`), subetiquetas (`SCAN`, `ANALYZE`, `MEASURE`, `GRADE`), telemetría (`— CENTERING`) y botones de código.

---

## 6. RESPUESTAS ESTRATÉGICAS A LAS 5 PREGUNTAS CLAVE

### 1. ¿Qué hace que el diseño se vea premium?
- **La integración de materialidad física real:** No utiliza representaciones vectoriales planas ni simulaciones de plástico con CSS básico; utiliza fotografía de estudio de alta resolución de un slab de acrílico real, con refracción de luz genuina sobre un pedestal de piedra volcánica cincelada.
- **La paleta de contrastes extremos controlados:** El uso del negro profundo (`#0A0D0B`) con un único punto de color verde esmeralda de laboratorio (`#48C765`), intercalado con la banda de piedra caliza pulida (`#EAE8E3`), evoca la arquitectura y editorial de marcas de lujo relojero y joyero (como Rolex, Patek Philippe o Leica).
- **Tipografía condensada con interletrado negativo:** El titular no tiene "aire suelto" entre letras; está fundido como un bloque de plomo de imprenta histórica, transmitiendo permanencia y valor indestructible.

### 2. ¿Qué hace que no parezca una web genérica?
- **Cero clichés de SaaS moderno:** No hay gradientes morados/púrpuras, no hay tarjetas flotantes con sombras difusas gigantes, no hay ilustraciones 3D de personajes caricaturescos, no hay badges con bordes redondeados de colores pastel, no hay iconos genéricos dentro de cajas de colores.
- **Composición asimétrica dramática:** El gorila no está en un círculo o dentro de una tarjeta; emerge orgánicamente de la oscuridad del lienzo detrás del producto, actuando como guardián y tótem de la marca.
- **Detalles editoriales de revista impresa:** El margen vertical con la regla tipográfica (`MORE THAN A GRADE | A HIGHER STANDARD`) y el sello circular de autenticación son recursos propios de publicaciones impresas de arte y coleccionismo de tirada limitada, no de una plantilla web estándar.

### 3. ¿Qué elementos son esenciales para conservar?
1. **La presencia del Gorila en low-key con el ojo iluminado:** Es el ancla emocional y el icono de poder de la marca.
2. **El Slab sobre el pedestal de basalto tallado (`COLLECT PRESERVE VALUE`):** Es la metáfora tangible de elevación de la carta a objeto de museo.
3. **El contraste de la cinta de marcas en fondo arena/piedra:** Es la única sección clara de toda la página; su eliminación rompería el ritmo y la jerarquía visual de la página.
4. **La secuencia isométrica de 4 cartas en la sección de tecnología:** Comunica el proceso científico (`SCAN`, `ANALYZE`, `MEASURE`, `GRADE`) sin necesidad de bloques densos de texto.
5. **Los 4 pilares fotográficos macro:** Conectan el servicio con los detalles físicos que obsesionan a los coleccionistas (bordes, rosetas de tinta, refracción, comunidad).

### 4. ¿Qué elementos no debemos introducir jamás?
1. **Iconografía decorativa infantil o cartoon.**
2. **Colores primarios estridentes (azul eléctrico, rojo comercial, amarillo chillón) fuera de las cartas originales.**
3. **Efectos de hover excesivos o rebotantes:** Toda transición debe ser rápida, limpia (200-300ms) y sofisticada (*cubic-bezier(0.16, 1, 0.3, 1)*).
4. **Tarjetas con fondos blancos dentro de las secciones oscuras.**
5. **Textos genéricos o frases vacías de marketing ("La mejor plataforma del mundo").**

### 5. ¿Qué decisiones de diseño hacen que esta composición funcione?
- **La tríada focal del Hero:** Cuando el usuario entra, su ojo realiza un recorrido en "Z" invertida natural:
  1. Lee el titular contundente `PRECISION GIVES VALUE` (impacto racional).
  2. Su mirada es atraída inmediatamente por el ojo iluminado del gorila (impacto emocional).
  3. Desciende hacia el slab y la carta Charizard en el pedestal (el producto tangible).
  4. Finaliza en el botón verde `Start Your Submission` (la conversión).
- **El ritmo lumínico de la página:** Oscuro (Hero) → Claro (Cinta de Marcas) → Oscuro Técnico (Tecnología) → Oscuro Modular (Pilares) → Verde Profundo (Misión). Este patrón evita la fatiga visual y mantiene al usuario inmerso mientras hace scroll.

---

## 7. COMPORTAMIENTO ESPERADO AL HACER SCROLL, ANIMACIONES Y RESPONSIVE

### 7.1 Scroll y Dinámica Visual
- **Efecto Parallax Sutil en el Hero:** Al hacer scroll descendente, el Gorila en el fondo debe desplazarse a un 30% de la velocidad del scroll, mientras que el Slab y el pedestal se desplazan a un 60%, acentuando la tridimensionalidad de la escena.
- **Sticky Navbar:** El navbar permanece fijo en el borde superior, transicionando su fondo de un 85% de opacidad a un 95% con una línea de borde blanca casi imperceptible para no restar protagonismo al contenido.

### 7.2 Micro-Interacciones de Lujo
- **Slab Hover Dynamics:** Al mover el cursor sobre el Hero, el slab acrílico reacciona con una rotación sutil en 3D (`perspective(1200px)` de máximo 2 a 3 grados), generando un destello de luz especular que recorre el bisel de cristal.
- **Láser de la Sección de Tecnología:** La línea horizontal cian/verde pulsa suavemente o realiza un barrido continuo que conecta las 4 etapas del escaneo.
- **Botón Primario:** Elevación de 1px con intensificación del resplandor verde perimetral, sin movimientos exagerados.

### 7.3 Adaptación Responsive Medible
- **Desktop Ultra-Wide (>1600px):** El contenedor se mantiene centrado en `1440px`, permitiendo que el negro profundo del fondo y el degradado del gorila se extiendan de forma infinita hacia los márgenes sin romper la composición.
- **Laptop Estándar (1024px - 1440px):** Proporciones exactas de la referencia, manteniendo la relación de columnas 6/6 o 5/7.
- **Tablet (768px - 1023px):**
  - Hero: El Gorila se reubica como fondo completo oscurecido con opacidad del 35%, el titular se redimensiona a `52px`, y el Slab se ubica centrado debajo de los CTAs.
  - Pilares: Pasan de 4 columnas a una cuadrícula de 2x2.
  - Cinta de Marcas: Scroll horizontal suave o disposición en 2 filas de 3 logos.
- **Mobile (<768px):**
  - Titular en `40px` a `44px`.
  - El Slab pasa al centro debajo del bloque tipográfico.
  - La sección de tecnología apila las cartas o permite deslizamiento horizontal con indicadores de paso.
  - Los 4 pilares se apilan verticalmente con espaciado de `16px`.

---

## 8. CONCLUSIÓN Y HOJA DE RUTA PARA LA RECONSTRUCCIÓN

Este **Blueprint Visual** define el estándar de excelencia irrenunciable para Gorilla Grading. Cada componente de código futuro deberá ser validado contra los parámetros, colores, jerarquías y proporciones aquí especificados, garantizando que el producto final sea idéntico, imponente y digno de una marca europea de máxima categoría.
