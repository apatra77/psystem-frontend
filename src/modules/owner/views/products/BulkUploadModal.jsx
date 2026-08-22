import { useEffect, useRef, useState } from 'react'
import {
  Clock,
  Download,
  Info,
  Upload,
  AlertTriangle,
  X,
} from 'lucide-react'
import PortalModal from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/app/store/uiStore'
import {
  downloadProductUploadFailedRecords,
  downloadProductUploadTemplate,
  normalizeBulkUploadResponse,
  uploadProductBulkFile,
} from '@/services/products'
import { colors } from '@/theme/colors'

const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx']
const ACCEPTED_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024
const FILE_INPUT_ID = 'bulk-upload-file-input'
const FORM_ID = 'bulk-upload-form'

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

function formatElapsedClock(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function UploadLoadingOverlay({ elapsedSeconds, onCancel }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-[22px] px-6"
      style={{
        background: 'rgba(4,10,8,0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Uploading file"
    >
      <div
        className="w-full max-w-[400px] rounded-[18px] px-8 py-8 text-center"
        style={{
          background: 'rgba(8,20,16,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div className="flex justify-center mb-5">
          <span
            className="w-9 h-9 rounded-full animate-spin"
            style={{
              border: '2.5px solid rgba(64,222,170,0.18)',
              borderTopColor: colors.accent,
              borderRightColor: colors.accent,
              boxShadow: '0 0 14px rgba(64,222,170,0.42)',
            }}
          />
        </div>

        <p className="text-[18px] font-extrabold text-white leading-tight">
          Uploading in progress
        </p>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
          Please do not close this window or refresh the page.
        </p>

        <div
          className="mt-6 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Clock size={15} strokeWidth={2.2} style={{ color: colors.accent, flexShrink: 0 }} />
          <span className="text-[12.5px] font-semibold" style={{ color: colors.textSecondary }}>
            Elapsed time:
          </span>
          <span
            className="text-[13px] font-extrabold tabular-nums tracking-wide"
            style={{ color: colors.accent }}
          >
            {formatElapsedClock(elapsedSeconds)}
          </span>
        </div>

        <div className="my-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold cursor-pointer transition-colors hover:bg-white/5"
          style={{
            color: colors.textHighlight,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'transparent',
          }}
        >
          <X size={14} strokeWidth={2.4} />
          Cancel Upload
        </button>
      </div>
    </div>
  )
}

export default function BulkUploadModal({ onClose, onUploaded }) {
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const uploadAbortRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadingFailedRecords, setDownloadingFailedRecords] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const busy = submitting || downloading || downloadingFailedRecords

  useEffect(() => {
    if (!submitting) {
      setElapsedSeconds(0)
      return undefined
    }

    setElapsedSeconds(0)

    const tick = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      clearInterval(tick)
    }
  }, [submitting])

  useEffect(() => () => uploadAbortRef.current?.(), [])

  const clearSelectedFile = () => {
    setFile(null)
    fileRef.current = null
    if (inputRef.current) inputRef.current.value = ''
  }

  const validateAndSetFile = (nextFile) => {
    if (!nextFile) return
    if (!isAcceptedFile(nextFile)) {
      setError('Please upload a CSV, XLS, or XLSX file.')
      clearSelectedFile()
      return
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError('File size must be 10MB or less.')
      clearSelectedFile()
      return
    }
    setError('')
    setFile(nextFile)
    fileRef.current = nextFile
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    validateAndSetFile(event.dataTransfer.files?.[0])
  }

  const handleDownloadTemplate = async () => {
    if (busy) return
    setDownloading(true)
    setError('')

    try {
      await downloadProductUploadTemplate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download template. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadFailedRecords = async () => {
    if (!uploadResult?.failedRecordsDownloadUrl || downloadingFailedRecords) return

    setDownloadingFailedRecords(true)
    setError('')

    try {
      await downloadProductUploadFailedRecords(uploadResult.failedRecordsDownloadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download failed records. Please try again.')
    } finally {
      setDownloadingFailedRecords(false)
    }
  }

  const handleCancelUpload = () => {
    uploadAbortRef.current?.()
  }

  const handleDismissUploadResult = () => {
    setUploadResult(null)
    onClose?.()
  }

  const handleSubmit = async (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()

    if (submitting || downloading) return

    const selectedFile = fileRef.current ?? file
    if (!selectedFile) {
      setError('Please select a file before submitting.')
      inputRef.current?.click()
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const uploadRequest = uploadProductBulkFile(selectedFile)
      uploadAbortRef.current = uploadRequest.abort
      const response = await uploadRequest.promise
      const result = normalizeBulkUploadResponse(response)

      if (result.failedCount > 0) {
        if (result.successCount > 0) {
          toast.success(`${result.successCount.toLocaleString('en-IN')} products uploaded successfully`)
          await onUploaded?.()
        }
        setUploadResult(result)
        return
      }

      if (!result.success && result.message) {
        throw new Error(result.message)
      }

      toast.success('Products uploaded successfully')
      await onUploaded?.()
      onClose?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload file. Please try again.'
      if (message !== 'Upload cancelled.') {
        setError(message)
      }
    } finally {
      uploadAbortRef.current = null
      setSubmitting(false)
    }
  }

  return (
    <PortalModal
      onClose={uploadResult ? handleDismissUploadResult : onClose}
      width={720}
      maxHeight="88vh"
      scrollable={false}
      closeOnBackdrop={!busy && !uploadResult}
    >
      <div className="relative flex flex-col max-h-[88vh]">
        {submitting && (
          <UploadLoadingOverlay elapsedSeconds={elapsedSeconds} onCancel={handleCancelUpload} />
        )}
        <div className="flex-shrink-0 flex items-start justify-between px-4 pt-4 pb-3">
          <div className="min-w-0 pr-4">
            <h2 className="text-[22px] font-extrabold text-white leading-tight">Bulk Upload Products</h2>
            <p className="text-[13px] mt-1" style={{ color: colors.textSecondary }}>
              Upload CSV or Excel file to add multiple products at once
            </p>
          </div>
          <button
            type="button"
            onClick={uploadResult ? handleDismissUploadResult : onClose}
            disabled={busy}
            className="cursor-pointer text-lg leading-none p-2 flex-shrink-0 disabled:opacity-60"
            style={{ color: colors.textDim }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          id={FORM_ID}
          className="flex-1 px-4 py-2 flex flex-col gap-4 min-h-0"
          onSubmit={handleSubmit}
        >
        {uploadResult ? (
          <div
            className="rounded-[14px] p-5"
            style={{ background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.28)' }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} style={{ color: colors.gold, flexShrink: 0, marginTop: 2 }} />
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-white">
                  {uploadResult.message || 'Upload completed with errors'}
                </p>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: colors.textSecondary }}>
                  {uploadResult.failedCount.toLocaleString('en-IN')} medicine
                  {uploadResult.failedCount === 1 ? '' : 's'} failed to upload.
                  {uploadResult.successCount > 0 && (
                    <>
                      {' '}
                      {uploadResult.successCount.toLocaleString('en-IN')} uploaded successfully.
                    </>
                  )}
                </p>
                <p className="text-[12px] mt-2" style={{ color: colors.textDim }}>
                  Download the failed records file to review the reasons and fix the rows.
                </p>
              </div>
            </div>
          </div>
        ) : (
        <>
        <div
          onClick={(event) => {
            if (event.target.closest('label')) return
            inputRef.current?.click()
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
            id={FILE_INPUT_ID}
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={(event) => validateAndSetFile(event.target.files?.[0])}
          />

          <label
            htmlFor={FILE_INPUT_ID}
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer"
            style={{
              color: colors.accent,
              background: 'rgba(64,222,170,0.08)',
              border: '1px solid rgba(64,222,170,0.34)',
            }}
          >
            <Upload size={14} strokeWidth={2.2} />
            Choose File
          </label>

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
        </>
        )}

        {error && (
          <div
            className="rounded-[10px] px-3.5 py-2 text-[12px] font-bold text-red-400"
            style={{ background: 'rgba(255,138,128,0.08)', border: '1px solid rgba(255,138,128,0.24)' }}
          >
            {error}
          </div>
        )}
        </form>

        <div
          className="flex-shrink-0 px-4 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.09)' }}
        >
        {uploadResult ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadFailedRecords}
              disabled={busy || !uploadResult.failedRecordsDownloadUrl}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer disabled:opacity-60"
              style={{
                color: colors.accentText,
                background: colors.primaryBtn,
                boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
              }}
            >
              {downloadingFailedRecords ? (
                <>
                  <Spinner />
                  Downloading…
                </>
              ) : (
                <>
                  <Download size={16} strokeWidth={2.2} />
                  Download Failed Records
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDismissUploadResult}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer disabled:opacity-60"
              style={{
                color: colors.textHighlight,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${colors.border}`,
              }}
            >
              Close
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer disabled:opacity-60"
            style={{
              color: colors.accent,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${colors.border}`,
            }}
          >
            {downloading ? (
              <>
                <Spinner />
                Downloading…
              </>
            ) : (
              <>
                <Download size={16} strokeWidth={2.2} />
                Download Template
              </>
            )}
          </button>
          <button
            type="submit"
            form={FORM_ID}
            disabled={submitting || downloading}
            className="inline-flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              color: colors.accentText,
              background: colors.primaryBtn,
              boxShadow: file ? '0 6px 18px rgba(64,222,170,0.35)' : 'none',
              opacity: file ? 1 : 0.55,
            }}
          >
            {submitting ? (
              'Uploading…'
            ) : (
              <>
                <Upload size={16} strokeWidth={2.2} />
                Submit
              </>
            )}
          </button>
        </div>
        )}
        </div>
      </div>
    </PortalModal>
  )
}
