import ExcelJS from 'exceljs'
import type { CargaType } from './columns'
import { getColumns } from './columns'

const NAVY = '1B2A4A'

export async function generateTemplate(type: CargaType) {
  const cols = getColumns(type)
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Datos')

  ws.columns = cols.map((c, i) => ({
    header: c.required ? `${c.header} *` : c.header,
    key: `col_${i}`,
    width: Math.max(c.header.length + 4, 18),
  }))

  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 28

  // Protect sheet but allow data entry in rows 2+
  ws.protect('', { selectLockedCells: true, selectUnlockedCells: true })
  headerRow.eachCell((cell) => { cell.protection = { locked: true } })
  for (let r = 2; r <= 1000; r++) {
    const row = ws.getRow(r)
    row.eachCell({ includeEmpty: true }, (cell) => { cell.protection = { locked: false } })
    cols.forEach((_, i) => {
      const cell = row.getCell(i + 1)
      cell.protection = { locked: false }
    })
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = type === 'propiedades' ? 'Template_Carga_Propiedades.xlsx' : 'Template_Carga_Desarrollos.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
