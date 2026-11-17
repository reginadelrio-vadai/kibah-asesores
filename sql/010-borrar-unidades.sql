-- ============================================================
-- 010 — BORRAR TODAS las unidades de base_kibah
-- ⚠ IRREVERSIBLE (salvo restaurando desde el respaldo de 009).
-- ⚠ Proyecto compartido: n8n, la API externa (/api/external/properties)
--   y cualquier otro servicio que lea base_kibah dejarán de ver propiedades
--   hasta que se vuelvan a cargar desde Desarrollos.
--
-- Correr SOLO después de 009 y de revisar su verificación.
-- No toca pagina_web_kibah (Desarrollos, Link Maps, imágenes, Link Drive).
-- ============================================================

DO $$
DECLARE
  actuales  BIGINT;
  respaldo  BIGINT;
BEGIN
  IF to_regclass('public.respaldo_base_kibah_20261117') IS NULL THEN
    RAISE EXCEPTION 'No existe el respaldo. Corre primero sql/009-respaldo-y-link-drive.sql';
  END IF;

  SELECT COUNT(*) INTO actuales FROM public.base_kibah;
  SELECT COUNT(*) INTO respaldo FROM public.respaldo_base_kibah_20261117;

  IF respaldo < actuales THEN
    RAISE EXCEPTION 'El respaldo tiene % filas y base_kibah %. Vuelve a generar el respaldo antes de borrar.', respaldo, actuales;
  END IF;

  DELETE FROM public.base_kibah;
  RAISE NOTICE 'Borradas % unidades. Respaldo intacto en respaldo_base_kibah_20261117 (% filas).', actuales, respaldo;
END $$;

-- Para RESTAURAR todo como estaba (si algo sale mal):
-- INSERT INTO public.base_kibah SELECT * FROM public.respaldo_base_kibah_20261117;
-- (Funciona mientras no cambien las columnas de base_kibah después del respaldo.)
