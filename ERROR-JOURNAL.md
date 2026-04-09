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