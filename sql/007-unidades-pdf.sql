-- ============================================================
-- 007 — Columnas para "Subir unidades por PDF"
-- Ejecutar en Supabase SQL Editor (proyecto compartido: solo AGREGA columnas
-- opcionales; no toca columnas existentes, la vista ni los triggers).
--
-- Igual que el resto de base_kibah, se guardan como TEXT.
-- Mapeo desde el PDF del desarrollador:
--   departamento → "Unidad"            (existente)
--   nivel        → "Nivel"             (nueva)
--   orient       → "Orientación"       (nueva)
--   rec          → "Número de recámaras" (existente)
--   baños        → "Número de baños"   (existente)
--   int m2       → "M2 Habitables"     (existente)
--   balcón m2    → "M2 Exteriores"     (existente)
--   patio m2     → "M2 Roof Garden/Jardín" (existente)
--   total m2     → "M2 Totales"        (existente)
--   bodega       → "Bodega"            (existente, Si/No)
--   eng 10/25/50/75% → "Precio Eng X%" (nuevas) + el que elija el usuario
--                      también va a "Precio por unidad"
-- ============================================================

ALTER TABLE public.base_kibah
  ADD COLUMN IF NOT EXISTS "Nivel" TEXT,
  ADD COLUMN IF NOT EXISTS "Orientación" TEXT,
  ADD COLUMN IF NOT EXISTS "Precio Eng 10%" TEXT,
  ADD COLUMN IF NOT EXISTS "Precio Eng 25%" TEXT,
  ADD COLUMN IF NOT EXISTS "Precio Eng 50%" TEXT,
  ADD COLUMN IF NOT EXISTS "Precio Eng 75%" TEXT;

-- Recarga el schema cache de PostgREST para que la API vea las columnas nuevas.
NOTIFY pgrst, 'reload schema';
