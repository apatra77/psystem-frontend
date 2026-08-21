import { useRef, useState } from 'react'
import {
  Download,
  Info,
  Upload,
} from 'lucide-react'
import PortalModal from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { colors } from '@/theme/colors'

const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx']
const ACCEPTED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024

const TEMPLATE_HEADERS = [
  'product_name',
  'generic_name',
  'description',
  'category',
  'sku',
  'stock_qty',
  'stock_unit',
  'mrp',
  'discount_percent',
  'price',
  'purchase_tax',
  'sales_tax',
]

const TEMPLATE_SAMPLE = [
  'Paracetamol 500mg',
  'Paracetamol',
  'Pain relief tablet',
  'Tablets',
  'SKU-001',
  '100',
  'units',
  '50',
  '10',
  '45',
  'GST5',
  'GST5',
]

function isAcceptedFile(file) {
  const name = file.name.toLowerCase()
  const byExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
  const byMime = ACCEPTED_MIME_TYPES.includes(file.type)
  return byExtension || byMime
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, TEMPLATE_SAMPLE]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'product-bulk-upload-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function BulkUploadModal({ onClose }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validateAndSetFile = (nextFile) => {
    if (!nextFile) return
    if (!isAcceptedFile(nextFile)) {
      setError('Please upload a CSV, XLS, or XLSX file.')
      setFile(null)
      return
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError('File size must be 10MB or less.')
      setFile(null)
      return
    }
    setError('')
    setFile(nextFile)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    validateAndSetFile(event.dataTransfer.files?.[0])
  }

  const handleSubmit = async () => {
    if (!file || submitting) return
    setSubmitting(true)
    setError('')

    try {
      // UI ready — wire to bulk upload API when available.
      await new Promise((resolve) => setTimeout(resolve, 600))
      onClose?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload file. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalModal
      onClose={onClose}
      width={720}
      maxHeight="88vh"
      scrollable={false}
      closeOnBackdrop={!submitting}
    >
      <div className="flex flex-col max-h-[88vh]">
        <div className="flex-shrink-0 flex items-start justify-between px-4 pt-4 pb-3">
          <div className="min-w-0 pr-4">
            <h2 className="text-[22px] font-extrabold text-white leading-tight">Bulk Upload Products</h2>
            <p className="text-[13px] mt-1" style={{ color: colors.textSecondary }}>
              Upload CSV or Excel file to add multiple products at once
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer text-lg leading-none p-2 flex-shrink-0 disabled:opacity-60"
            style={{ color: colors.textDim }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-4 py-2 flex flex-col gap-4 min-h-0">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setDragging(false)
          }}
          onDrop={handleDrop}
          className="rounded-[16px] px-6 py-7 text-center cursor-pointer transition-colors"
          style={{
            border: `1.5px dashed ${dragging ? colors.accent : 'rgba(255,255,255,0.18)'}`,
            background: dragging ? 'rgba(64,222,170,0.06)' : 'rgba(255,255,255,0.02)',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={(event) => validateAndSetFile(event.target.files?.[0])}
          />

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              inputRef.current?.click()
            }}
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer"
            style={{
              color: colors.accent,
              background: 'rgba(64,222,170,0.08)',
              border: '1px solid rgba(64,222,170,0.34)',
            }}
          >
            <Upload size={14} strokeWidth={2.2} />
            Choose File
          </button>

          <p className="text-[15px] font-extrabold text-white">
            Upload CSV or Excel file
          </p>
          <p className="text-[12.5px] mt-1" style={{ color: colors.textDim }}>
            {file
              ? `${file.name} · ${formatFileSize(file.size)} · Click or drop to replace`
              : 'Drag and drop your file here, or click to browse'}
          </p>

          <div className="mt-5 space-y-0.5 text-[11px]" style={{ color: colors.textDim }}>
            <p>Supported formats: CSV, XLS, XLSX</p>
            <p>Maximum file size: 10MB</p>
          </div>
        </div>

        <div
          className="rounded-[14px] p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.borderSubtle}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Info size={15} style={{ color: colors.accent }} />
            <p className="text-[13px] font-extrabold" style={{ color: colors.accent }}>
              Instructions
            </p>
          </div>
          <ul className="space-y-1.5 text-[12px] leading-snug pl-1" style={{ color: colors.textSecondary }}>
            <li>• Download the template and fill in your product details</li>
            <li>• Make sure all required fields are filled</li>
          </ul>
        </div>

        {error && (
          <div
            className="rounded-[10px] px-3.5 py-2 text-[12px] font-bold text-red-400"
            style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
          >
            {error}
          </div>
        )}
        </div>

        <div
          className="flex-shrink-0 px-4 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.09)' }}
        >
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer disabled:opacity-60"
            style={{
              color: colors.accent,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${colors.border}`,
            }}
          >
            <Download size={16} strokeWidth={2.2} />
            Download Template
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || submitting}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
            }}
          >
            {submitting ? (
              <>
                <Spinner />
                Uploading…
              </>
            ) : (
              <>
                <Upload size={16} strokeWidth={2.2} />
                Submit
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </PortalModal>
  )
}
