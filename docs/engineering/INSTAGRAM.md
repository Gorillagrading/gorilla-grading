# Instagram en la web

La sección «Comunidad en acción» de la home enseña las últimas 4 publicaciones de la cuenta
`@gorillagradinginternational`. Se leen con la API oficial de Instagram y se actualizan solas.

## Cómo funciona

- `GET /api/v1/instagram/posts` (pública) devuelve las últimas publicaciones. La respuesta se guarda 10 minutos en
  la red de Vercel y 10 minutos en memoria de la función, así que Instagram recibe muy pocas consultas.
- Una publicación nueva aparece en la web en un máximo de ~10 minutos. Si se borra o se edita en Instagram, el
  cambio llega igual.
- La clave de acceso de Instagram dura 60 días. Se guarda en la tabla `integration_tokens` y la tarea diaria
  (`/api/v1/jobs/advance-orders`, 07:00) la **renueva sola** cuando han pasado 20 días desde la última renovación. Nadie tiene que
  acordarse.
- Si Instagram falla o la cuenta no está conectada, la sección enseña un enlace a la cuenta en lugar de contenido
  de relleno. La web nunca se rompe por esto.

## Conectar la cuenta (una sola vez)

Requisito: la cuenta es **profesional** (Business o Creador).

1. Entra en <https://developers.facebook.com/apps> con el Facebook de la empresa y crea una app de tipo **Empresa**
   (Business).
2. Añade el producto **Instagram** → **Inicio de sesión de Instagram para empresas** (API setup with Instagram login).
3. En «Generar tokens de acceso», pulsa **Agregar cuenta**, inicia sesión con la cuenta de Instagram del proyecto y
   acepta los permisos. Para **leer** publicaciones basta `instagram_business_basic`.
4. Pulsa **Generar token** y copia el valor. Es una clave de larga duración (60 días).
5. En Vercel → Settings → Environment Variables, crea `INSTAGRAM_ACCESS_TOKEN` con ese valor, en Production, y
   vuelve a desplegar.
6. Abre `https://<tu-dominio>/api/v1/instagram/posts`: debe verse `"configured": true` y la lista de posts.

Mientras la app esté en modo desarrollo, la cuenta debe estar añadida como **tester** o **administrador** de la app.
Para leer solo su propia cuenta no hace falta la revisión de Meta.

## Si algún día deja de mostrar publicaciones

- Revisa en Vercel los registros: una línea con `"source":"instagram"` explica el motivo.
- Si la clave caducó (la web estuvo más de 60 días sin recibir la tarea diaria), genera una nueva en el paso 4 y
  pégala en `INSTAGRAM_ACCESS_TOKEN`: el servidor detecta que cambió y sustituye la guardada.

## Publicar desde la web (no incluido)

Publicar automáticamente en Instagram usa otra API (`instagram_business_content_publish`) y exige que Meta apruebe
la app, lo que puede tardar semanas. No está implementado.
