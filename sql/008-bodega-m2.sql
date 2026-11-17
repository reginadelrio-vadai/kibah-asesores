-- ============================================================
-- 008 — Tamaño de bodega para "Subir unidades por PDF"
-- Ejecutar en Supabase SQL Editor. Solo AGREGA una columna opcional
-- (TEXT como el resto de base_kibah); no toca la vista ni lo que usa n8n.
-- ============================================================

ALTER TABLE public.base_kibah
  ADD COLUMN IF NOT EXISTS "M2 Bodega" TEXT;

NOTIFY pgrst, 'reload schema';
