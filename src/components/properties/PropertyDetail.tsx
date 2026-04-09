'use client'

import { useEffect, useCallback } from 'react'
import { X, Copy, ExternalLink } from 'lucide-react'
import type { Property, UserRole } from '@/types'
import {
  formatPrice,
  formatM2,
  formatComision,
  displayValue,
  capitalize,
} from '@/lib/utils/format'
import { DISPONIBILIDAD_COLORS, TIPO_PREVENTA_COLORS } from '@/lib/utils/constants'

interface PropertyDetailProps {
  property: Property
  role: UserRole
  onClose: () => void
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd className="text-sm text-text-primary font-medium mt-0.5">{value}</dd>
    </div>
  )
}

export function PropertyDetail({ property, role, onClose }: PropertyDetailProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard/propiedades?id=${property.id_propiedad}`
    navigator.clipboard.writeText(url)
  }

  const disponibilidadStyle =
    DISPONIBILIDAD_COLORS[property.disponibilidad ?? '']
  const tipoPreventaStyle =
    TIPO_PREVENTA_COLORS[property.tipo_preventa ?? '']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[720px] max-h-[90vh] overflow-y-auto
          bg-bg-secondary dark:bg-glass-bg dark:backdrop-blur-[var(--glass-blur)]
          border border-border-primary dark:border-glass-border
          rounded-[20px] md:rounded-[20px] shadow-xl
          max-md:fixed max-md:inset-0 max-md:max-w-none max-md:max-h-none max-md:rounded-none"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-secondary/80 dark:bg-glass-bg/80 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {displayValue(property.nombre_kibah || property.nombre_desarrollador)}
            </h2>
            {property.unidad && (
              <p className="text-sm text-text-secondary">{property.unidad}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary
                bg-bg-tertiary rounded-[var(--radius-sm)] hover:bg-border-primary transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
              Copiar link
            </button>
            {property.link_drive && (
              <a
                href={property.link_drive}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white
                  bg-orange rounded-[var(--radius-sm)] hover:bg-orange-hover transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                Drive
              </a>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)]
                hover:bg-bg-tertiary transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 divide-y divide-border-primary">
          {/* Badges */}
          <div className="py-4 flex items-center gap-2 flex-wrap">
            {disponibilidadStyle && property.disponibilidad && (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${disponibilidadStyle.bg} ${disponibilidadStyle.text}`}
              >
                {property.disponibilidad}
              </span>
            )}
            {tipoPreventaStyle && property.tipo_preventa && (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${tipoPreventaStyle.bg} ${tipoPreventaStyle.text}`}
              >
                {capitalize(property.tipo_preventa)}
              </span>
            )}
            <span className="text-lg font-bold text-text-primary ml-auto">
              {formatPrice(property.precio_unidad)}
            </span>
          </div>

          {/* Info General */}
          <Section title="Información General">
            <Field label="Nombre Kibah" value={displayValue(property.nombre_kibah)} />
            {role === 'admin' && (
              <Field label="Desarrollo" value={displayValue(property.nombre_desarrollador)} />
            )}
            <Field label="Unidad" value={displayValue(property.unidad)} />
            <Field label="Disponibilidad" value={displayValue(property.disponibilidad)} />
          </Section>

          {/* Ubicacion */}
          <Section title="Ubicación">
            <Field label="Dirección" value={displayValue(property.direccion)} />
            <Field label="Colonia" value={displayValue(property.colonia)} />
            <Field label="Alcaldía" value={displayValue(property.alcaldia)} />
          </Section>

          {/* Caracteristicas */}
          <Section title="Características">
            <Field label="M² Totales" value={formatM2(property.m2_totales)} />
            <Field label="M² Habitables" value={formatM2(property.m2_habitables)} />
            <Field label="M² Exteriores" value={formatM2(property.m2_exteriores)} />
            <Field label="M² Roof/Jardín" value={formatM2(property.m2_roof_garden)} />
            <Field label="Recámaras" value={displayValue(property.num_recamaras)} />
            <Field label="Baños" value={displayValue(property.num_banos)} />
            <Field label="Estacionamiento" value={displayValue(property.estacionamiento)} />
            <Field label="Bodega" value={displayValue(property.bodega)} />
            {property.amenidades && (
              <div className="col-span-2">
                <Field label="Amenidades" value={property.amenidades} />
              </div>
            )}
          </Section>

          {/* Entrega */}
          <Section title="Entrega">
            <Field label="Tipo" value={capitalize(property.tipo_preventa)} />
            <Field label="Estado de Obra" value={displayValue(property.tipo_entrega)} />
            <Field label="Fecha de Entrega" value={displayValue(property.fecha_entrega)} />
          </Section>

          {/* Contacto (admin only) */}
          {role === 'admin' && (
            <Section title="Contacto">
              <Field
                label="Contacto Desarrollador"
                value={displayValue(property.contacto_desarrollador)}
              />
              <Field label="Comisión" value={formatComision(property.pct_comision)} />
              {property.link_drive && (
                <Field
                  label="Link Drive"
                  value={
                    <a
                      href={property.link_drive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange hover:underline"
                    >
                      Abrir en Drive
                    </a>
                  }
                />
              )}
            </Section>
          )}
        </div>

        {/* Footer spacing */}
        <div className="h-4" />
      </div>
    </div>
  )
}
