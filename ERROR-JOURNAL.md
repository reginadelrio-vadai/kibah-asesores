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

## 6. Selección del PDF persistía después de descargar (PdfBuilder)
- **Error:** Tras "Generar y Descargar PDF", la selección quedaba guardada; al volver a /dashboard/pdf reaparecía el PDF ya descargado.
- **Causa:** `usePdfSelection` persiste la selección en sessionStorage y `handleGenerate` nunca la limpiaba tras la descarga exitosa.
- **Fix:** Llamar `doReset()` (clearSelection + limpiar asesor/cliente) después de descargar el PDF, dentro del `try` para que un fallo conserve la selección y permita reintentar.
- **Regla:** Todo estado persistido (sessionStorage/localStorage) que representa un "trabajo en curso" debe limpiarse al completarse el flujo exitosamente; conservarlo solo en caso de error.