const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Consultar precio'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || num === 0) return 'Consultar precio'
  return `${priceFormatter.format(num)} MXN`
}

export function formatM2(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  // Preserve decimals; strip trailing zeros
  const formatted = Number.isInteger(num) ? String(num) : String(num).replace(/\.?0+$/, '')
  return `${formatted} m²`
}

export function formatComision(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value}%`
}

export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function capitalize(value: string | null | undefined): string {
  if (!value) return '—'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function toTitleCase(value: string | null | undefined): string {
  if (!value) return '—'
  return value
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
