/** Escapa los comodines de ILIKE (%, _ y \) para comparar un texto de forma literal. */
export function escapeIlike(value: string): string {
  return value.trim().replace(/[\%_]/g, (c) => `\${c}`)
}
