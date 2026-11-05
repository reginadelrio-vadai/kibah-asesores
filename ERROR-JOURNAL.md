# Error Journal — Kibah Asesores

## 1. View con columnas inventadas (M1)
- **Error:** El SQL de 001-foundation.sql usó columnas que no existen en base_kibah ("Nombre", "Tipo", "Precio")
- **Causa:** El prompt decía "genera el SQL del Master Doc" pero Claude Code no tiene acceso al Master Doc
- **Fix:** Se creó SQL corregido con columnas reales ("Nombre Desarrollador", "Precio por unidad", etc.)
- **Regla:** SIEMPRE verificar columnas reales leyendo la tabla en Supabase o el archivo SQL existente. NUNCA inventar nombres de columnas.

## 2. Carga de 2,600 propiedades sin paginación (M2)
- **Error:** La página se trabó y tumbó la computadora del usuario
- **Causa:** Se cargaron todas las propiedades de golpe sin respetar el límite de paginación
- **Fix:** Forzar LIMIT 20 por default, máximo 50 por request
- **Regla:** SIEMPRE paginar. NUNCA cargar más de 50 registros en una sola request. Default = 20.

## 3. Zod v4 API differences (M3)
- **Error:** Build failed because `z.enum()` second param uses `{ message: '...' }` not `{ errorMap: () => ({}) }`, and `z.number()` uses `{ error: '...' }` not `{ invalid_type_error: '...' }`. Also `ZodError.errors` doesn't exist — it's `ZodError.issues`.
- **Causa:** Project uses Zod v4 which has a simplified API compared to v3 docs.
- **Fix:** Changed to `z.enum(values, { message })`, `z.number({ error })`, and `err.issues`.
- **Regla:** This project uses Zod v4. Use `{ message }` for enums, `{ error }` for number/string, and `.issues` not `.errors` on ZodError.

## 4. Supabase JS client doesn't need SQL-escaped quotes in column names (M3)
- **Error:** `Could not find '% Comisión' column of 'base_kibah' in the schema cache` — insert/update failed.
- **Causa:** COLUMN_MAP had column names wrapped in escaped double quotes (`'"Nombre Kibah"'`). Supabase JS client handles quoting automatically — the object keys should be plain strings (`'Nombre Kibah'`).
- **Fix:** Removed all escaped double quotes from COLUMN_MAP values.
- **Regla:** When using Supabase JS `.insert()` / `.update()`, column names go as plain strings WITHOUT SQL quotes. The client handles quoting internally.

## 5. Campos numéricos no deben usar .int() si aceptan decimales (M3)
- **Error:** num_banos rechazaba 2.5 (medio baño) porque tenía `.int()` en el schema Zod.
- **Causa:** Se asumió que baños/recámaras/estacionamiento eran siempre enteros.
- **Fix:** Removido `.int()` de num_banos, num_recamaras, estacionamiento en el schema Zod.
- **Regla:** Solo usar `.int()` cuando el campo sea ESTRICTAMENTE entero. Baños/recámaras/estacionamiento pueden ser decimales (2.5 baños = medio baño).

## 6. Selección de PDF persistía después de generar el PDF
- **Error:** Tras generar y descargar el PDF, el banner flotante "X propiedades — Generar PDF" seguía visible en Propiedades y la selección quedaba activa.
- **Causa:** La selección vive en `sessionStorage` (`usePdfSelection`) y `handleGenerate` en `PdfBuilder.tsx` nunca la limpiaba; solo "Nuevo PDF" o "Limpiar selección" lo hacían.
- **Fix:** Llamar `doReset()` (limpia selección, cliente y restaura asesor) después de una generación exitosa en `handleGenerate`. Solo en éxito — si falla la generación, la selección se conserva.
- **Regla:** Cuando un flujo "completa" una acción (generar/enviar/guardar), limpiar su estado transitorio persistido (sessionStorage/localStorage) en el camino de éxito, nunca en el de error.

## 7. Todas las API routes daban 500 en producción sin cambios de código (2026-09-22)
- **Error:** `/api/properties`, `/api/column-visibility` y `/api/saved-filters` respondían 500 en crm.kibah.com.mx. El login funcionaba y el usuario entraba al dashboard, pero ninguna lista cargaba. Sin código nuevo desde el 25 de agosto.
- **Causa:** Incidente de Supabase (status.supabase.com, incidente `6q5902p2xd9f`, abierto desde 2026-08-14): PostgREST tenía un caché de reloj atorado y rechazaba los JWT recién emitidos con `PGRST303 JWT issued at future`. Auth (GoTrue) seguía funcionando, la Data API (`/rest/v1`) rechazaba todo. Nuestras rutas convierten ese error de Supabase en 500. El proyecto además es Nano y estaba en el incidente "Unresponsive Projects" (2026-09-10/11).
- **Fix:** Supabase → Project Settings → General → "Restart project". Después, cerrar sesión y volver a entrar para obtener un token nuevo. Pendiente: aplicar el upgrade de versión que Supabase publique en el dashboard para este incidente (fix definitivo; el reinicio puede ser temporal).
- **Regla:** Si TODAS las rutas dan 500 pero el login pasa y no hubo deploy, no es código. Diagnóstico rápido en orden: (1) `curl` sin sesión debe dar 401, eso descarta env vars; (2) en Supabase SQL Editor, `select usename, count(*) from pg_stat_activity group by usename` — si no aparece `authenticator`, PostgREST no está conectado; (3) revisar status.supabase.com antes de tocar claves o config; (4) reiniciar el proyecto. Nunca rotar claves ni redesplegar como primer paso: eso no era la causa y habría roto más.
- **Nota:** Los errores `Cannot read properties of undefined (reading 'M_ID')` en `200.js`/`requests.js` en consola NO son de la app; son de una extensión del navegador que envuelve `fetch`. Ignorarlos.
