---
version: 2
slug: "src-pages-adminpage-tsx"
primary_target: "src/pages/AdminPage.tsx"
related_targets: ["src/pages/admin/TodayPanel.tsx", "src/pages/admin/OrderQueue.tsx", "src/pages/admin/ui.tsx"]
---

# Panel del laboratorio (/admin)

Scope: todo el panel interno (Hoy, Pedidos, detalle de pedido, Eventos, Equipo, Negocio). Mode: Operate.
Audience: equipo del laboratorio (staff, grader, qa, admin) en ordenador de mesa toda la jornada; tablet junto al escáner; dirección en el móvil.
Job: saber qué hay que hacer ahora y hacerlo (recibir, identificar, importar PDF, aprobar, enviar), sin saltarse la doble firma.
User asks: más profesional, serio, intuitivo, entendible, de nivel empresarial, original. Herramienta propia (sin menú ni pie de la web pública). "Hoy" abre con la cola de trabajo.

## Direction contract

FORM: Banco de calibración (seed:d1fd75fce6ec46b6, assigned, chosen by user 2026-11-04 with "mucho más profesional"). Rendition: minimal enterprise, chosen by user 2026-11-04 (commit e2077d1).
THESIS: el panel es el banco de medida del laboratorio, dicho en voz baja: una sola tinta, el color solo cuando significa algo, y el estado del laboratorio entero en una línea. Rechaza el dashboard de tarjetas de colores con iconos y saludos.
OWN-WORLD: carril claro (blanco, filete #E7E7E2, activo #F1F1EE, contadores en mono apagado); lienzo neutro #F6F6F3; hojas blancas con filete #E7E7E2 y esquinas de 8-10 px (campos y botones 6-8 px); una sola tinta #0F1110 para botón principal, foco y selección. Color solo con significado: tarde #C2362B, aviso #A86A12; verde Gorilla #2F8F3E solo en el escudo y el punto de "entregado". Una sola familia (Archivo) + mono tabular (JetBrains Mono) para códigos y recuentos. Títulos en frase, sin rótulos en mayúsculas.
STORY: primero lo urgente (fuera de plazo), luego la cola por acción, luego el estado del laboratorio entero.
FIRST VIEWPORT: carril con secciones y contadores; barra superior con ruta y buscador ("/"); frase titular con lo que toca hoy; línea del laboratorio; cola de trabajo con filtros segmentados, tareas agrupadas y un botón de acción por tarea.
SIGNATURE: la línea del laboratorio (sustituye a la regla de plazo): siete estaciones sobre una sola línea de tinta, recuento encima, una rayita por pedido y en rojo las de los pedidos que van tarde. El plazo por fila queda como barra compacta de 56 px con palabras ("6 días", "Mañana", "+2 días").
RAISES: pausas y cancelaciones siguen visibles; una tipografía y retícula de filetes; urgencia por una escala fija (tinta en plazo, ámbar vence ya, rojo tarde), no por colores sueltos.
