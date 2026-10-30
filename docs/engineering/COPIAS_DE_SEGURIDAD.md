# Copias de seguridad

Hay tres niveles de copia. Cada uno cubre lo que el anterior no cubre.

| Copia | Qué guarda | Cada cuánto | Cuánto dura | Dónde |
|---|---|---|---|---|
| Supabase (plan Pro) | Base de datos | Cada día, hacia las 02:20 UTC | 7 días | Supabase, UE (París) |
| Copia semanal propia | Base de datos **y fotos**, cifrada | Domingos, 03:00 UTC | 35 días | GitHub (Actions) |
| Copia mensual | La última copia semanal | El primer lunes de cada mes | Indefinido | Disco externo de la empresa |

Las copias de Supabase **no incluyen las fotos** de las cartas: solo la copia semanal las guarda.

## Puesta en marcha (una sola vez)

En GitHub, entra en el repositorio → **Settings → Secrets and variables → Actions → New repository secret** y crea estos cuatro secretos:

| Nombre | Dónde se consigue |
|---|---|
| `BACKUP_DATABASE_URL` | Supabase → botón **Connect** → **Session pooler** (puerto 5432). Sustituye `[YOUR-PASSWORD]` por la contraseña de la base de datos. |
| `SUPABASE_URL` | Vercel → proyecto → Settings → Environment Variables → `SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel → el mismo sitio → `SUPABASE_SERVICE_ROLE_KEY` |
| `BACKUP_PASSWORD` | Una contraseña larga nueva. **Guárdala también fuera de GitHub** (gestor de contraseñas de la empresa). Sin ella las copias no se pueden abrir, y nadie puede recuperarla. |

Después, en **Actions → Copia de seguridad semanal → Run workflow**, lanza la primera copia a mano y comprueba que termina en verde.

Si una copia falla, GitHub envía un correo a quien activó la tarea.

## Copia mensual al disco externo

1. GitHub → **Actions** → **Copia de seguridad semanal** → pulsa la ejecución más reciente en verde.
2. Abajo, en **Artifacts**, descarga `gorilla-grading-copia-AAAA-MM-DD`. Llega un `.zip` con un archivo `.7z` dentro.
3. Saca el `.7z` del `.zip` y cópialo al disco externo en una carpeta con el año y el mes.
4. Compruébalo: ábrelo con [7-Zip](https://www.7-zip.org/) y escribe la contraseña. Si ves `base-de-datos.dump`, `fotos` y `LEEME.txt`, la copia está bien. Ciérralo sin extraer nada.
5. Borra el `.zip` de la carpeta de descargas: contiene datos de clientes.

Guarda el disco externo en un lugar seguro, separado del ordenador.

## Restaurar

Restaurar lo hace una persona técnica. Primero hay que decidir qué restaurar:

- **Error reciente en la base de datos (menos de 7 días):** usa la copia diaria de Supabase: **Database → Backups → Restore** en el día anterior al problema. Es lo más rápido. La web deja de funcionar mientras se restaura.
- **Error más antiguo, o se ha perdido el proyecto de Supabase:** usa la copia semanal o mensual, como se explica abajo.
- **Fotos borradas:** solo están en la copia semanal o mensual.

### Base de datos desde la copia semanal

Necesitas `pg_restore` 17 o superior (incluido en PostgreSQL). Restaura siempre primero en un proyecto de Supabase **nuevo y vacío**, comprueba los datos y solo entonces apunta la web al proyecto nuevo, o copia lo que falte.

```sh
7z x gorilla-grading-copia-AAAA-MM-DD.7z          # pide la contraseña
pg_restore --no-owner --no-privileges \
  --dbname "<cadena Session pooler del proyecto destino>" \
  base-de-datos.dump
```

### Fotos desde la copia semanal

La carpeta `fotos/` tiene la misma estructura que el bucket `lab-private`. Para subirla, usa el panel de Supabase (**Storage → lab-private → Upload**), arrastrando las carpetas, o la CLI de Supabase.

## Datos personales

Las copias contienen datos de clientes: nombres, correos, direcciones, pedidos y fotos. Por eso:

- Siempre van cifradas con AES-256. Sin la contraseña no se ve ni la lista de archivos.
- La copia en GitHub se borra sola a los 35 días.
- Las copias mensuales del disco externo se borran cuando superan el plazo de conservación que fije la asesora legal.
