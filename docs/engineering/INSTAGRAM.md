# Instagram en la web

La sección «Comunidad en acción» de la home enseña las últimas 4 publicaciones de la cuenta
`@gorillagradinginternational`. Se leen con la API oficial de Instagram y se actualizan solas.

## Cómo funciona

- `GET /api/v1/instagram/posts` (pública) devuelve las últimas publicaciones. La respuesta se guarda 10 minutos en
  la red de Vercel y 10 minutos en memoria de la función, así que Instagram recibe muy pocas consultas.
- Una publicación nueva aparece en la web en un máximo de ~10 minutos. Si se borra o se edita en Instagram, el
  cambio llega igual.
- La clave se guarda en la tabla `integration_tokens`. Si es de «inicio de sesión de Instagram» dura 60 días y la
  tarea diaria (`/api/v1/jobs/advance-orders`, 07:00) la **renueva sola** a los 20 días. Si es de usuario del
  sistema (inicio de sesión unificado) no caduca y no hay nada que renovar.
- Si Instagram falla o la cuenta no está conectada, la sección enseña un enlace a la cuenta en lugar de contenido
  de relleno. La web nunca se rompe por esto.

## Conectar la cuenta (una sola vez)

Requisito: la cuenta es **profesional** (Business o Creador). El servidor acepta los dos tipos de clave que entrega
Meta y detecta solo cuál es:

| Clave | Dónde se genera | Caduca |
|---|---|---|
| Inicio de sesión **unificado** (usuario del sistema) | Casos de uso → API de Instagram → *API setup with Unified login* | No |
| Inicio de sesión de **Instagram** | *API setup with Instagram login*, si tu app lo ofrece | 60 días (se renueva sola) |

### Con el inicio de sesión unificado (el que ofrece hoy la app «Gorilla Grading MEDIA APP»)

1. En developers.facebook.com abre la app → *Casos de uso* → **Administrar mensajes y contenido en Instagram** →
   **API setup with Unified login**.
2. Paso 1: pulsa **Crear nueva configuración**. La configuración que propone Meta (variación «General», identificador
   de usuario del sistema, activo «Cuenta de Instagram») es la correcta.
3. Paso 2: la cuenta de Instagram debe tener el rol **Instagram Tester** en *Roles de la aplicación*; acepta la
   invitación desde Instagram (Configuración → Permisos del sitio web → Invitaciones de tester). Después pulsa
   **Añadir cuenta** y **Generar identificador de acceso**.
4. En Vercel → Settings → Environment Variables crea `INSTAGRAM_ACCESS_TOKEN` con ese valor (Production) y vuelve
   a desplegar. Si la cuenta no se encuentra sola, añade también `INSTAGRAM_USER_ID` con el identificador numérico
   de la cuenta de Instagram.
5. Abre `https://<tu-dominio>/api/v1/instagram/posts`: debe verse `"configured": true` y la lista de posts. Si sale
   `"posts": []`, mira en Vercel los registros: una línea con `"source":"instagram"` dice el motivo.

Esta clave **no caduca**, pero da más permisos de los que la web necesita (anuncios, mensajes, publicar). Guárdala
solo en Vercel, no la compartas, y si se filtra revócala desde el usuario del sistema en el Administrador comercial.

### Con el inicio de sesión de Instagram

Mismo recorrido, pero en *API setup with Instagram login* → *Generar tokens de acceso* → **Agregar cuenta**, con el
permiso `instagram_business_basic`. Pega el valor en `INSTAGRAM_ACCESS_TOKEN`.

Mientras la app esté en modo desarrollo, la cuenta debe ser tester o administrador de la app. Para leer solo su
propia cuenta no hace falta la revisión de Meta.

## Si algún día deja de mostrar publicaciones

- Revisa en Vercel los registros: una línea con `"source":"instagram"` explica el motivo.
- Si la clave caducó (la web estuvo más de 60 días sin recibir la tarea diaria), genera una nueva en el paso 4 y
  pégala en `INSTAGRAM_ACCESS_TOKEN`: el servidor detecta que cambió y sustituye la guardada.

## Publicar desde la web (no incluido)

Publicar automáticamente en Instagram usa otra API (`instagram_business_content_publish`) y exige que Meta apruebe
la app, lo que puede tardar semanas. No está implementado.
