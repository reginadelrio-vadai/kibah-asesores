import ExcelJS from 'exceljs'
import type { CargaType } from './columns'
import { getColumns, DATE_COLUMNS } from './columns'

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

  // Date columns: set numFmt to '@' (text) so Excel doesn't auto-convert
  cols.forEach((c, i) => {
    if (DATE_COLUMNS.has(c.header)) {
      const col = ws.getColumn(i + 1)
      col.numFmt = '@'
    }
  })

  // Data validation (dropdowns) for columns with allowed values
  cols.forEach((c, i) => {
    if (c.allowedValues && c.allowedValues.length > 0) {
      const colIdx = i + 1
      for (let r = 2; r <= 1000; r++) {
        const cell = ws.getCell(r, colIdx)
        cell.dataValidation = {
          type: 'list',
          allowBlank: !c.required,
          formulae: [`"${c.allowedValues.join(',')}"`],
          showErrorMessage: true,
          errorTitle: 'Valor no válido',
          error: `Opciones: ${c.allowedValues.join(', ')}`,
        }
      }
    }
  })

  // Protect sheet but allow data entry in rows 2+
  ws.protect('', { selectLockedCells: true, selectUnlockedCells: true })
  headerRow.eachCell((cell) => { cell.protection = { locked: true } })
  for (let r = 2; r <= 1000; r++) {
    cols.forEach((_, i) => {
      const cell = ws.getCell(r, i + 1)
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
