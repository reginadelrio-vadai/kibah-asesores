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