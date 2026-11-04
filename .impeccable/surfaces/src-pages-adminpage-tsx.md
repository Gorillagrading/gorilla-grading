---
version: 1
slug: "src-pages-adminpage-tsx"
primary_target: "src/pages/AdminPage.tsx"
related_targets: ["src/pages/admin/TodayPanel.tsx"]
---

# Panel del laboratorio (/admin)

Scope: todo el panel interno (Hoy, Pedidos, detalle de pedido, Eventos, Equipo, Negocio). Mode: Operate.
Audience: equipo del laboratorio (staff, grader, qa, admin) en ordenador de mesa toda la jornada; tablet junto al escáner; dirección en el móvil.
Job: saber qué hay que hacer ahora y hacerlo (recibir, identificar, importar PDF, aprobar, enviar), sin saltarse la doble firma.
User asks: más profesional, serio, intuitivo, entendible, de nivel empresarial, original. Herramienta propia (sin menú ni pie de la web pública). "Hoy" abre con la cola de trabajo.

## Direction contract

FORM: Banco de calibración (seed:d1fd75fce6ec46b6, assigned, chosen by user 2026-11-04 with "mucho más profesional").
THESIS: el panel es el banco de medida del laboratorio: el plazo de cada pedido se lee sobre una escala, no se adivina. Rechaza el dashboard de tarjetas de colores con iconos y saludos.
OWN-WORLD: carril lateral grafito (#1A1D1C), suelo gris banco (#EDEEEA), hojas blancas con filetes de 1 px (#D7D9D3), tinta #121413; verde Gorilla solo para acción principal y avance; estados de la carta de calibración (cian recibido, violeta calidad, ámbar aviso, rojo vencido). Una sola familia (Archivo) + mono tabular (JetBrains Mono) para códigos, cifras y medidas. Esquinas de 2 px, sin sombras de adorno.
STORY: primero lo urgente (fuera de plazo), luego la cola por acción, luego el estado del laboratorio entero.
FIRST VIEWPORT: carril con secciones y contadores; barra superior con búsqueda por número; tira de parches con pedidos por fase (y cuántos van tarde); cola de trabajo con regla de plazo en cada fila; columna lateral con avisos.
SIGNATURE: la regla de plazo: barra milimetrada con un tick por día hábil del servicio, cruz de registro en hoy, marca roja en la fecha prevista; tarde = tramo rojo más allá de la marca.
RAISES: los estados se sellan y nunca desaparecen (pausas y cancelaciones siguen visibles); una tipografía y retícula de filetes; urgencia por escala fija, no por colores sueltos.
