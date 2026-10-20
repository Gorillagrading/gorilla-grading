# Regla de la nota (versión 1)

Define cómo se pasa de las cuatro subnotas (centrado, esquinas, bordes y superficie) a la nota final de una carta, y qué etiqueta lleva cada nota. Está implementada en [shared/grading.ts](../../shared/grading.ts) y la impone la base de datos con restricciones `CHECK` en `grading_results` (ver [db/schema.ts](../../db/schema.ts)). Una nota que incumpla la regla no se puede guardar. La regla se explica al público, con una calculadora, en la página `/grading-scale` ("Cómo calculamos la nota"), que usa el mismo código que valida los certificados.

> **Estado:** propuesta basada en el mercado, pendiente de que el laboratorio la confirme. Es una definición de producto de Gorilla Grading: cambiarla es editar `shared/grading.ts` y generar una migración.

## La regla

1. Cada subnota va de **1 a 10 en pasos de 0,5**.
2. Se hace la **media** de las cuatro y se redondea al 0,5 más cercano. Si queda justo en medio, **hacia abajo**.
3. La nota final **no puede superar en más de 0,5 a la peor subnota**.
4. Para un **9,5 o un 10** hacen falta **al menos tres subnotas en 9,5 o más**.
5. **"Pristine 10"** es un 10 con **las cuatro subnotas en 10**. Cualquier otro 10 es **"Gem Mint 10"**.
6. Un graduador puede poner una nota **inferior** a la que dan las subnotas; **nunca superior**.

> **Comprobado sobre las 130.321 combinaciones posibles de subnotas:** un 10 solo sale con 10/10/10/10 o con tres 10 y un 9,5 (5 combinaciones). Por eso no hace falta una regla aparte para el 10, ni para "la cuarta subnota en 9 o más": se deducen de las reglas 2 y 3. La base de datos las comprueba igualmente; es redundante, pero equivalente (hay una prueba que lo verifica con el SQL real de la migración).

### Etiquetas

| Nota | Etiqueta | | Nota | Etiqueta |
|---|---|---|---|---|
| 10 | Pristine 10 / Gem Mint 10 | | 5,5 | Very Good-Excellent 5.5 |
| 9,5 | Mint+ 9.5 | | 5 | Very Good-Excellent 5 |
| 9 | Mint 9 | | 4,5 / 4 | Very Good 4.5 / Very Good 4 |
| 8,5 | Near Mint-Mint 8.5 | | 3,5 / 3 | Good 3.5 / Good 3 |
| 8 | Near Mint 8 | | 2,5 / 2 | Fair 2.5 / Fair 2 |
| 7,5 | Near Mint 7.5 | | 1,5 / 1 | Poor 1.5 / Poor 1 |
| 7 / 6,5 / 6 | Excellent 7 / 6.5 / 6 | | | |

Los nombres de 10 a 8,5 siguen la escala pública de CGC y los ya usados en la web. **Los nombres por debajo de 7 son una propuesta** que no se ha contrastado con ninguna fuente; conviene que el laboratorio los revise.

### Ejemplos

| Subnotas (C / E / B / S) | Media | Nota | Por qué |
|---|---|---|---|
| 10 / 10 / 10 / 10 | 10 | **10 Pristine** | cuatro 10 |
| 10 / 10 / 9,5 / 10 | 9,875 | **10 Gem Mint** | tres 10 y ninguna por debajo de 9,5 |
| 9,5 / 9,5 / 10 / 9,5 | 9,625 | **9,5** | tres de 9,5 o más y ninguna por debajo de 9 |
| 9 / 8,5 / 8,5 / 9 | 8,75 | **8,5** | media justo en medio, hacia abajo |
| 9,5 / 9,5 / 9 / 8 | 9,0 | **8,5** | la peor subnota (8) limita a 8,5. Es el ejemplo publicado por Beckett |
| 10 / 10 / 10 / 8 | 9,5 | **8,5** | la media diría 9,5, pero la peor subnota manda |
| 9 / 9 / 10 / 10 | 9,5 | **9** | la media diría 9,5, pero solo hay dos subnotas de 9,5 o más |

## Qué hace el mercado

| Graduador | Subnotas | Cómo llega a la nota final | Fuente |
|---|---|---|---|
| **Beckett (BGS)** | Sí, cuatro | **No es la media.** La subnota más baja pesa más. Fórmula exacta no publicada. "Black Label 10" exige cuatro 10; el "Gold 10" admite un 9,5 | Beckett (FAQ, citado por terceros) y [guía de CardGrade](https://cardgrade.io/blog/beckett-bgs-card-grading-guide) |
| **CGC** | No las publica | Cada nota tiene requisitos propios. "Pristine 10": centrado 50/50 y sin defectos a 10 aumentos. "Gem Mint 10": centrado hasta ~55/45 delante y 75/25 detrás | [Escala oficial de CGC](https://www.cgccards.com/card-grading/grading-scale/) |
| **PSA** | No | Notas enteras de 1 a 10, definidas por requisitos. Un 10 admite hasta ~55/45 de centrado | Solo guías de terceros |

**Lo que sí está contrastado:** CGC publica sus requisitos por nota (fuente oficial). Beckett afirma que su nota no es una media y que la subnota más baja pesa más; el ejemplo 9,5 / 9,5 / 9 / 8 da 8,5.

**Lo que NO se pudo contrastar** (las páginas oficiales de Beckett y PSA bloquean la lectura automática):
- La regla "tres subnotas de 9,5 o más" para el 9,5 procede de comentarios de coleccionistas que citan a Beckett (que además hablan de "la cuarta en 9 o más", algo que aquí ya garantiza el tope de la peor subnota).
- El tope de "+0,5 sobre la peor subnota" es la lectura habitual de los coleccionistas; Beckett no lo publica. Algunos foros dicen que a veces llega a +1. Se ha elegido +0,5, la opción más estricta.
- Los detalles de PSA proceden de guías de terceros.

## Decisiones tomadas y por qué

- **Estricta antes que generosa.** Ante dudas (empates, topes), la regla elige la nota más baja. En un producto cuya función es verificar autenticidad y estado, sobrevalorar una carta es peor que infravalorarla.
- **Basada en Beckett y no en PSA o CGC** porque Gorilla ya publica cuatro subnotas, como Beckett. Las etiquetas altas (Pristine / Gem Mint) y la exigencia de centrado perfecto para el "Pristine" vienen de CGC.
- **La nota máxima la fija la base de datos.** La app propone la nota calculada, pero aunque un error de código la saltara, la base de datos no guardaría un certificado incoherente.

## Qué corrigió esta regla en los datos de ejemplo

Cade Cunningham tenía un **9,5 con la etiqueta "Gem Mint 10"**. Con esta regla un 9,5 es "Mint+ 9.5". Las otras tres cartas ya cumplían la regla.

## Pendiente de decidir con el laboratorio

1. **Centrado medido.** CGC y PSA fijan un centrado máximo por nota (por ejemplo, un 10 no admite peor de 55/45 delante). Para aplicarlo hace falta guardar el centrado como número y no como texto. Conviene hacerlo al construir la entrada de notas.
2. **Etiquetas por debajo de 7.**
3. **Si el "Pristine 10" debe exigir también centrado 50/50** (como CGC) además de las cuatro subnotas en 10 (como Beckett).
4. ~~Si se publica esta regla en la web~~ **Hecho:** está publicada en `/grading-scale`. Como compromete públicamente a Gorilla Grading, conviene que el laboratorio confirme la regla antes de abrir la web al público.
