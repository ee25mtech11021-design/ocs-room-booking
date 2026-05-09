'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ImportRoomsForm({ blocks }: { blocks: any[] }) {
  const [preview, setPreview]   = useState<any[]>([])
  const [errors, setErrors]     = useState<string[]>([])
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')
  const [fileName, setFileName] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage('')
    setErrors([])
    setPreview([])
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet)

      validateAndPreview(rows)
    }
    reader.readAsBinaryString(file)
  }

  const validateAndPreview = (rows: any[]) => {
    const validRows: any[] = []
    const errs: string[]   = []

    rows.forEach((row, i) => {
      const rowNum = i + 2 // +2 because row 1 is header

      // Normalize keys to lowercase and trim whitespace
      const normalized: any = {}
      Object.keys(row).forEach(k => {
        normalized[k.toLowerCase().trim()] = 
          typeof row[k] === 'string' ? row[k].trim() : row[k]
      })

      const blockName  = normalized['block'] || normalized['block name'] || normalized['block_name']
      const roomNumber = normalized['room'] || normalized['room number'] || normalized['room_number'] || normalized['room name']
      const capacity   = normalized['capacity'] || normalized['seating capacity']
      const notes      = normalized['notes'] || normalized['note'] || ''

      // Validate required fields
      if (!blockName) {
        errs.push(`Row ${rowNum}: Missing block name`)
        return
      }
      if (!roomNumber) {
        errs.push(`Row ${rowNum}: Missing room number`)
        return
      }
      if (!capacity || isNaN(parseInt(capacity))) {
        errs.push(`Row ${rowNum}: Missing or invalid capacity`)
        return
      }

      // Match block name to existing blocks
      const matchedBlock = blocks.find(b =>
        b.name.toLowerCase().includes(blockName.toLowerCase()) ||
        blockName.toLowerCase().includes(b.name.toLowerCase())
      )

      if (!matchedBlock) {
        errs.push(`Row ${rowNum}: Block "${blockName}" not found. Available blocks: ${blocks.map(b => b.name).join(', ')}`)
        return
      }

      validRows.push({
        block_id:    matchedBlock.id,
        block_name:  matchedBlock.name,
        room_number: roomNumber.toString(),
        capacity:    parseInt(capacity),
        notes:       notes.toString(),
        is_available: true,
      })
    })

    setPreview(validRows)
    setErrors(errs)
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    setLoading(true)
    setMessage('')

    // Remove block_name before inserting (it's just for display)
    const toInsert = preview.map(({ block_name, ...rest }) => rest)

    const { error } = await supabase
      .from('rooms')
      .upsert(toInsert, {
        onConflict: 'block_id, room_number',
        ignoreDuplicates: false,
      })

    setLoading(false)
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`✅ Successfully imported ${preview.length} rooms!`)
      setPreview([])
      setFileName('')
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
      <h3 className="font-semibold text-gray-800 mb-1">Import Rooms from Spreadsheet</h3>
      <p className="text-xs text-gray-400 mb-4">
        Supports Excel (.xlsx) and CSV files. 
        Download the <a href="#" onClick={downloadTemplate}
          className="text-blue-600 hover:underline">template</a> to get started.
      </p>

      {/* File Upload */}
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
        <div className="flex flex-col items-center">
          <span className="text-2xl">📂</span>
          <span className="text-sm text-gray-500 mt-1">
            {fileName ? fileName : 'Click to upload or drag and drop'}
          </span>
          <span className="text-xs text-gray-400">
            .xlsx or .csv
          </span>
        </div>
        <input type="file" accept=".xlsx,.xls,.csv"
          onChange={handleFile} className="hidden" />
      </label>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium mb-1">
            ⚠️ {errors.length} row(s) have issues and will be skipped:
          </p>
          <ul className="text-xs text-red-500 list-disc list-inside">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Preview — {preview.length} rooms ready to import:
          </p>
          <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Block</th>
                  <th className="px-4 py-2 text-left">Room</th>
                  <th className="px-4 py-2 text-left">Capacity</th>
                  <th className="px-4 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{row.block_name}</td>
                    <td className="px-4 py-2">{row.room_number}</td>
                    <td className="px-4 py-2">{row.capacity}</td>
                    <td className="px-4 py-2 text-gray-400">{row.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {message && (
            <p className={`text-sm mt-3 ${
              message.startsWith('✅') ? 'text-green-600' : 'text-red-500'
            }`}>
              {message}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={handleImport} disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Importing...' : `Import ${preview.length} Rooms`}
            </button>
            <button onClick={() => { setPreview([]); setErrors([]); setFileName('') }}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              Clear
            </button>
          </div>
        </div>
      )}

      {message && preview.length === 0 && (
        <p className="text-sm mt-3 text-green-600">{message}</p>
      )}
    </div>
  )
}

// Generates and downloads a template Excel file
function downloadTemplate(e: React.MouseEvent) {
  e.preventDefault()
  const XLSX = require('xlsx')
  const template = [
    {
      'Block': 'LHC',
      'Room Number': 'LH-01',
      'Capacity': 72,
      'Notes': 'Has projector'
    },
    {
      'Block': 'A Block',
      'Room Number': 'Class Room 320',
      'Capacity': 80,
      'Notes': ''
    },
  ]
  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Rooms')
  XLSX.writeFile(wb, 'rooms_template.xlsx')
}