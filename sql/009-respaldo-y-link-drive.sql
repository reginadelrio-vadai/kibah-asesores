-- ============================================================
-- 009 — Respaldo completo + Link Drive en Desarrollos
-- Ejecutar en Supabase SQL Editor ANTES de 010 (el borrado).
-- No borra nada. Proyecto compartido: solo crea tablas de respaldo
-- y AGREGA columnas opcionales.
-- ============================================================

-- 0) Unidades: columnas nuevas. Van ANTES del respaldo para que este tenga las mismas
--    columnas que base_kibah y se pueda restaurar con SELECT * (ver 010).
--    "Link Drive" (la vieja) NO se borra: n8n y la API externa podrían leerla.
ALTER TABLE public.base_kibah
  ADD COLUMN IF NOT EXISTS "Link Drive Desarrollo" TEXT,
  ADD COLUMN IF NOT EXISTS "Link Drive Unidad" TEXT;

-- 1) Respaldo completo (todas las columnas, todas las filas)
CREATE TABLE IF NOT EXISTS public.respaldo_base_kibah_20261117 AS
  SELECT * FROM public.base_kibah;

CREATE TABLE IF NOT EXISTS public.respaldo_pagina_web_kibah_20261117 AS
  SELECT * FROM public.pagina_web_kibah;

-- Las tablas en "public" se exponen por la API: RLS sin políticas = solo service role las lee.
ALTER TABLE public.respaldo_base_kibah_20261117 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respaldo_pagina_web_kibah_20261117 ENABLE ROW LEVEL SECURITY;

-- 2) Respaldo fácil de consultar: TODOS los links de Drive de las unidades,
--    marcando cuáles son propios (distintos al más usado de su edificio).
CREATE TABLE IF NOT EXISTS public.respaldo_links_drive_unidades_20261117 AS
WITH links AS (
  SELECT id, "Nombre Kibah", "Unidad", "Nombre Desarrollador", TRIM("Link Drive") AS link
  FROM public.base_kibah
  WHERE TRIM("Link Drive") ~* '^https?://'
),
mas_usado AS (
  SELECT LOWER(TRIM("Nombre Kibah")) AS k,
         MODE() WITHIN GROUP (ORDER BY link) AS link_edificio,
         COUNT(*) AS unidades_con_link,
         COUNT(DISTINCT link) AS links_distintos
  FROM links GROUP BY 1
)
SELECT l.id AS id_base_kibah, l."Nombre Kibah", l."Unidad", l."Nombre Desarrollador" AS torre,
       l.link AS link_drive,
       m.link_edificio,
       m.unidades_con_link,
       m.links_distintos,
       (l.link <> m.link_edificio) AS es_link_propio,
       EXISTS (SELECT 1 FROM public.pagina_web_kibah p
               WHERE LOWER(TRIM(p."Nombre Kibah")) = LOWER(TRIM(l."Nombre Kibah"))) AS tiene_desarrollo
FROM links l
JOIN mas_usado m ON m.k = LOWER(TRIM(l."Nombre Kibah"));

ALTER TABLE public.respaldo_links_drive_unidades_20261117 ENABLE ROW LEVEL SECURITY;

-- 3) Desarrollos: nueva columna "Link Drive" (la verdad absoluta del edificio),
--    llenada con el link más usado por sus unidades. No pisa uno que ya exista.
--    Si cada unidad tiene un link distinto (ej. Chiapas II) no hay link de edificio: queda vacío.
ALTER TABLE public.pagina_web_kibah
  ADD COLUMN IF NOT EXISTS "Link Drive" TEXT;

UPDATE public.pagina_web_kibah p
SET "Link Drive" = r.link_edificio
FROM (
  SELECT DISTINCT LOWER(TRIM("Nombre Kibah")) AS k, link_edificio
  FROM public.respaldo_links_drive_unidades_20261117
  WHERE NOT (links_distintos = unidades_con_link AND unidades_con_link > 1)
) r
WHERE LOWER(TRIM(p."Nombre Kibah")) = r.k
  AND (p."Link Drive" IS NULL OR TRIM(p."Link Drive") = '');

NOTIFY pgrst, 'reload schema';

-- 4) Verificación (revisa estos números antes de correr 010):
SELECT
  (SELECT COUNT(*) FROM public.base_kibah)                              AS unidades_actuales,
  (SELECT COUNT(*) FROM public.respaldo_base_kibah_20261117)            AS unidades_respaldadas,
  (SELECT COUNT(*) FROM public.respaldo_links_drive_unidades_20261117)  AS links_drive_respaldados,
  (SELECT COUNT(*) FROM public.respaldo_links_drive_unidades_20261117 WHERE es_link_propio) AS links_propios,
  (SELECT COUNT(*) FROM public.pagina_web_kibah WHERE "Link Drive" IS NOT NULL) AS desarrollos_con_link_drive;
-- Esperado hoy: 3068 | 3068 | 1391 | ~11-12 | ~74 (72 con link único + Aristóteles II + Adolfo López Mateos I;
-- Chiapas II queda vacío)
