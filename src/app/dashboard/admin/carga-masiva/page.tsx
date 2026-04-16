'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Building, Building2, Download, Upload, CheckCircle2, XCircle,
  ArrowLeft, Loader2, AlertTriangle, FileSpreadsheet, RefreshCw,
} from 'lucide-react'
import ExcelJS from 'exceljs'
import { Toast, type ToastType } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { type CargaType, getColumns, type ColumnDef, DATE_COLUMNS, smartTitleCase } from '@/components/carga-masiva/columns'
import { generateTemplate } from '@/components/carga-masiva/generateTemplate'

type Step = 0 | 1 | 2 | 3 | 4

interface RowData {
  row: number
  values: Record<string, string>
  errors: string[]
  valid: boolean
}

const STEPS = ['Preparar archivo', 'Subir archivo', 'Revisar datos', 'Confirmar carga']

function cleanNumeric(val: string): string {
  return val.replace(/[$,\s]/g, '').trim()
}

function normalizeRow(values: Record<string, string>, type: CargaType): Record<string, string> {
  const out = { ...values }
  const preventa = out['Entrega Inmediata/Preventa']
  if (preventa) out['Entrega Inmediata/Preventa'] = preventa.toLowerCase().trim()
  const disp = out['Disponibilidad']
  if (disp) out['Disponibilidad'] = disp.charAt(0).toUpperCase() + disp.slice(1).toLowerCase()

  if (out['Colonia']) out['Colonia'] = smartTitleCase(out['Colonia'])
  if (out['Alcaldia']) out['Alcaldia'] = smartTitleCase(out['Alcaldia'])

  const cols = getColumns(type)
  for (const c of cols) {
    if (c.type === 'number' && out[c.header]) {
      out[c.header] = cleanNumeric(out[c.header])
    }
  }
  return out
}

function validateRows(rows: RowData[], cols: ColumnDef[], type: CargaType): RowData[] {
  const required = cols.filter((c) => c.required)
  const numericCols = cols.filter((c) => c.type === 'number')
  const dropdownCols = cols.filter((c) => c.allowedValues && c.allowedValues.length > 0)
  const seen = new Map<string, number>()

  return rows.map((r) => {
    const errors: string[] = []
    for (const col of required) {
      if (!r.values[col.header]?.trim()) errors.push(`"${col.header}" es obligatorio`)
    }
    for (const col of numericCols) {
      const v = r.values[col.header]?.trim()
      if (v && isNaN(Number(v))) errors.push(`"${col.header}" no es un número válido`)
    }
    for (const col of dropdownCols) {
      const v = r.values[col.header]?.trim()
      if (v && col.allowedValues) {
        const match = col.allowedValues.find((a) => a.toLowerCase() === v.toLowerCase())
        if (!match) {
          errors.push(`"${col.header}": valor no válido '${v}'. Opciones: ${col.allowedValues.join(', ')}`)
        } else {
          r.values[col.header] = match
        }
      }
    }
    const key = type === 'propiedades'
      ? `${r.values['Nombre Kibah']?.trim()}|||${r.values['Unidad']?.trim()}`
      : r.values['Nombre Kibah']?.trim() ?? ''
    const prevRow = seen.get(key)
    if (prevRow !== undefined) {
      errors.push(`Duplicado en el archivo (fila ${prevRow})`)
    } else {
      seen.set(key, r.row)
    }
    return { ...r, errors, valid: errors.length === 0 }
  })
}

async function generateErrorReport(rows: RowData[], cols: ColumnDef[]) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Errores')
  ws.columns = [
    { header: 'Fila', key: 'row', width: 8 },
    ...cols.map((c, i) => ({ header: c.header, key: `col_${i}`, width: 18 })),
    { header: 'Error', key: 'error', width: 40 },
  ]
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } }

  for (const r of rows.filter((r) => !r.valid)) {
    const rowData: Record<string, unknown> = { row: r.row, error: r.errors.join('; ') }
    cols.forEach((c, i) => { rowData[`col_${i}`] = r.values[c.header] ?? '' })
    ws.addRow(rowData)
  }
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Reporte_Errores.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export default function CargaMasivaPage() {
  const [type, setType] = useState<CargaType | null>(null)
  const [step, setStep] = useState<Step>(0)
  const [rows, setRows] = useState<RowData[]>([])
  const [parsing, setParsing] = useState(false)
  const [inserting, setInserting] = useState(false)
  const [confirmInsert, setConfirmInsert] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [result, setResult] = useState<{ count: number; lote: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((msg: string, t: ToastType) => setToast({ message: msg, type: t }), [])
  const cols = type ? getColumns(type) : []
  const validCount = rows.filter((r) => r.valid).length
  const errorCount = rows.filter((r) => !r.valid).length

  const handleSelectType = (t: CargaType) => {
    setType(t)
    setStep(1)
    setRows([])
    setResult(null)
  }

  const parseFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      showToast('Formato no válido. Solo se aceptan archivos .xlsx', 'error')
      return
    }
    setParsing(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buf)
      const ws = wb.worksheets[0]
      if (!ws) { showToast('El archivo no tiene hojas', 'error'); return }

      const headerRow = ws.getRow(1)
      const headers: string[] = []
      headerRow.eachCell((cell, i) => { headers[i - 1] = String(cell.value ?? '').replace(/\s*\*\s*$/, '').trim() })

      // Verify headers match template
      const expected = cols.map((c) => c.header)
      const missing = expected.filter((h) => !headers.includes(h))
      if (missing.length > 0) {
        showToast(`El archivo no tiene el formato correcto. Faltan columnas: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`, 'error')
        return
      }

      const parsed: RowData[] = []
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return
        const values: Record<string, string> = {}
        let hasData = false
        headers.forEach((h, i) => {
          const cell = row.getCell(i + 1)
          let v = ''
          if (cell.value !== null && cell.value !== undefined) {
            // Excel may convert date-like text to Date objects
            if (cell.value instanceof Date && DATE_COLUMNS.has(h)) {
              const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
              v = `${months[cell.value.getMonth()]} ${cell.value.getFullYear()}`
            } else if (cell.value instanceof Date) {
              v = cell.value.toISOString().slice(0, 10)
            } else {
              v = String(cell.value).trim()
            }
          }
          if (v) hasData = true
          values[h] = v
        })
        if (hasData) parsed.push({ row: rowNum, values: normalizeRow(values, type!), errors: [], valid: true })
      })

      if (parsed.length === 0) {
        showToast('El archivo no tiene datos (solo headers)', 'error')
        return
      }

      // Validate
      let validated = validateRows(parsed, cols, type!)

      // Check duplicates against DB
      try {
        const checkItems = validated.map((r) => ({
          nombre_kibah: r.values['Nombre Kibah']?.trim() ?? '',
          unidad: r.values['Unidad']?.trim(),
          row: r.row,
        }))
        const res = await fetch('/api/carga-masiva/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, items: checkItems }),
        })
        if (res.ok) {
          const { duplicates } = await res.json()
          const dupRows = new Set((duplicates as Array<{ row: number }>).map((d) => d.row))
          validated = validated.map((r) => {
            if (dupRows.has(r.row)) {
              const errs = [...r.errors, 'Ya existe en la plataforma']
              return { ...r, errors: errs, valid: false }
            }
            return r
          })
        }
      } catch { /* silent — proceed without DB check */ }

      setRows(validated)
      setStep(3)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al leer el archivo', 'error')
    } finally {
      setParsing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
    e.target.value = ''
  }

  const handleInsert = async () => {
    setConfirmInsert(false)
    setInserting(true)
    try {
      const now = new Date()
      const lote = `LOTE-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

      // Build header→dbColumn map for columns with dbColumn override
      const colMap = new Map<string, string>()
      for (const c of cols) {
        if (c.dbColumn) colMap.set(c.header, c.dbColumn)
      }

      const items = rows.filter((r) => r.valid).map((r) => {
        const mapped: Record<string, unknown> = {}
        for (const [header, value] of Object.entries(r.values)) {
          if (value) mapped[colMap.get(header) ?? header] = value
        }
        return mapped
      })

      const res = await fetch('/api/carga-masiva/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, lote, items }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        showToast(body.error || 'Error durante la inserción', 'error')
        return
      }

      const data = await res.json()
      setResult({ count: data.count, lote: data.lote })
      setStep(4)
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setInserting(false)
    }
  }

  // =============== RENDER ===============

  // Type selection
  if (!type) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="kibah-page-title">Carga Masiva</h1>
          <p className="kibah-page-desc mt-1">Importa propiedades o desarrollos desde un archivo Excel</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {[
            { t: 'propiedades' as CargaType, icon: Building, label: 'Propiedades', desc: 'Importar propiedades individuales (unidades)' },
            { t: 'desarrollos' as CargaType, icon: Building2, label: 'Desarrollos', desc: 'Importar desarrollos completos' },
          ].map(({ t, icon: Icon, label, desc }) => (
            <button key={t} onClick={() => handleSelectType(t)} className="kibah-card p-6 text-left cursor-pointer">
              <Icon className="w-8 h-8 text-orange mb-3" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-text-primary">{label}</h3>
              <p className="text-sm text-text-secondary mt-1">{desc}</p>
              <span className="inline-block mt-3 text-sm font-medium text-orange">Seleccionar →</span>
            </button>
          ))}
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    )
  }

  const typeLabel = type === 'propiedades' ? 'Propiedades' : 'Desarrollos'

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="kibah-page-title">Carga Masiva — {typeLabel}</h1>
          <p className="kibah-page-desc mt-1">Importa {typeLabel.toLowerCase()} desde un archivo Excel</p>
        </div>
        <div className="flex items-center gap-2">
          {step >= 2 && (
            <button
              onClick={() => { rows.length > 0 || result ? setConfirmReset(true) : (() => { setType(null); setStep(0); setRows([]); setResult(null) })() }}
              className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.5} /> Empezar de nuevo
            </button>
          )}
          <button onClick={() => { setType(null); setStep(0); setRows([]); setResult(null) }} className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Cambiar tipo
          </button>
        </div>
      </div>

      {/* Stepper */}
      {step < 4 && (
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const stepNum = i + 1
            const active = step === stepNum
            const done = step > stepNum
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-0.5 ${done || active ? 'bg-orange' : 'bg-border-primary'}`} />}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  ${active ? 'bg-orange text-white' : done ? 'bg-orange/15 text-orange' : 'bg-bg-tertiary text-text-tertiary'}`}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> : <span>{stepNum}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* STEP 1: Prepare */}
      {step === 1 && (
        <div className="kibah-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-text-primary">¿Cómo funciona la carga masiva?</h2>
          <ol className="space-y-3 text-sm text-text-secondary">
            <li><strong className="text-text-primary">1. Descarga el template</strong> — Haz click en el botón de abajo para descargar el archivo Excel con las columnas correctas</li>
            <li><strong className="text-text-primary">2. Llena los datos</strong> — Abre el archivo en Excel o Google Sheets. Cada fila es un(a) {type === 'propiedades' ? 'propiedad' : 'desarrollo'}. No modifiques los encabezados</li>
            <li><strong className="text-text-primary">3. Campos obligatorios</strong> — Las columnas marcadas con * son obligatorias</li>
            <li><strong className="text-text-primary">4. Guarda el archivo</strong> — Guarda como .xlsx (formato Excel)</li>
            <li><strong className="text-text-primary">5. Sube el archivo</strong> — Regresa aquí y sube el archivo en el siguiente paso</li>
          </ol>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Columnas del template</h3>
            <div className="flex flex-wrap gap-2">
              {cols.map((c) => (
                <span key={c.header} className={`kibah-badge ${c.required ? 'kibah-badge-preventa' : 'bg-bg-tertiary text-text-tertiary'}`}>
                  {c.header}{c.required ? ' *' : ''}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-border-primary">
            <button onClick={() => generateTemplate(type)} className="kibah-btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              <Download className="w-4 h-4" strokeWidth={1.5} /> Descargar Template de {typeLabel}
            </button>
            <button onClick={() => setStep(2)} className="kibah-btn-secondary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Ya tengo mi archivo listo →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Upload */}
      {step === 2 && (
        <div className="kibah-card p-6 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 py-16 border-2 border-dashed border-orange/40 rounded-[var(--radius-sm)] cursor-pointer hover:border-orange hover:bg-orange/5 transition-colors"
          >
            {parsing ? (
              <Loader2 className="w-10 h-10 text-orange animate-spin" strokeWidth={1.5} />
            ) : (
              <Upload className="w-10 h-10 text-orange" strokeWidth={1.5} />
            )}
            <p className="text-sm font-medium text-text-primary">{parsing ? 'Procesando archivo...' : 'Arrastra tu archivo aquí o haz click para seleccionar'}</p>
            <p className="text-xs text-text-tertiary">Formato aceptado: .xlsx (Excel)</p>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFileInput} className="hidden" />
          <button onClick={() => setStep(1)} className="text-sm text-text-tertiary hover:text-text-primary cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />Volver
          </button>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="kibah-card p-4 flex items-center gap-4 flex-wrap">
            <div className="text-sm text-text-primary font-medium">
              <FileSpreadsheet className="w-4 h-4 inline mr-1 text-text-tertiary" strokeWidth={1.5} />
              {rows.length} registros encontrados
            </div>
            <span className="kibah-badge kibah-badge-active">{validCount} válidos</span>
            {errorCount > 0 && <span className="kibah-badge kibah-badge-inactive">{errorCount} con errores</span>}
          </div>

          {errorCount > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-[var(--radius-sm)] bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Corrige los errores antes de continuar</p>
                <p className="text-xs text-red-500/80 mt-0.5">Puedes descargar un reporte de errores o subir un archivo corregido</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border-primary max-h-[50vh]">
            <table className="kibah-table text-xs">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th style={{ width: '40px' }}>#</th>
                  {cols.map((c) => <th key={c.header} className="whitespace-nowrap">{c.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.row} className={!r.valid ? 'bg-red-500/5' : ''}>
                    <td>{r.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} /> : <XCircle className="w-4 h-4 text-red-500" strokeWidth={1.5} />}</td>
                    <td className="text-text-tertiary">{r.row}</td>
                    {cols.map((c) => (
                      <td key={c.header} className="whitespace-nowrap max-w-[200px] truncate">
                        {r.values[c.header] || <span className="text-text-tertiary">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Error details per row */}
          {errorCount > 0 && (
            <div className="space-y-1">
              {rows.filter((r) => !r.valid).slice(0, 20).map((r) => (
                <p key={r.row} className="text-xs text-red-500">
                  <strong>Fila {r.row}:</strong> {r.errors.join('; ')}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-border-primary">
            <button onClick={() => { setStep(2); setRows([]) }} className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              ← Subir otro archivo
            </button>
            {errorCount > 0 && (
              <button onClick={() => generateErrorReport(rows, cols)} className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Download className="w-4 h-4" strokeWidth={1.5} /> Descargar reporte de errores
              </button>
            )}
            <button
              onClick={() => setConfirmInsert(true)}
              disabled={errorCount > 0 || inserting}
              className="kibah-btn-primary"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              {inserting ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> Insertando...</> : `Confirmar carga (${validCount})`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && result && (
        <div className="kibah-card p-8 text-center max-w-lg mx-auto space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold text-text-primary">¡Carga exitosa!</h2>
          <p className="text-sm text-text-secondary">Se importaron <strong>{result.count}</strong> {typeLabel.toLowerCase()}.</p>
          <p className="text-xs text-text-tertiary">Lote: {result.lote}</p>

          {type === 'desarrollos' && (
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius-sm)] bg-orange/10 border border-orange/20 text-left">
              <AlertTriangle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm text-orange font-medium">Recuerda subir las imágenes de cada desarrollo desde la sección de Desarrollos.</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => { setType(null); setStep(0); setRows([]); setResult(null) }} className="kibah-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Hacer otra carga
            </button>
            <a href={type === 'propiedades' ? '/dashboard/propiedades' : '/dashboard/admin/desarrollos'} className="kibah-btn-primary" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
              Ir a {typeLabel}
            </a>
          </div>
        </div>
      )}

      {confirmInsert && (
        <ConfirmDialog
          title="Confirmar carga"
          message={`¿Confirmar la carga de ${validCount} ${typeLabel.toLowerCase()}? Esta acción no se puede deshacer.`}
          confirmLabel="Confirmar"
          onConfirm={handleInsert}
          onCancel={() => setConfirmInsert(false)}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Empezar de nuevo"
          message="¿Empezar de nuevo? Se perderán los datos actuales."
          confirmLabel="Empezar de nuevo"
          variant="danger"
          onConfirm={() => { setConfirmReset(false); setType(null); setStep(0); setRows([]); setResult(null) }}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
