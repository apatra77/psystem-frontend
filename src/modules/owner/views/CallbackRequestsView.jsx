import { useCallback, useEffect, useState } from 'react'
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Filter, Phone, RotateCcw } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/app/store/uiStore'
import {
  CALLBACK_REQUEST_PAGE_SIZE,
  fetchAdminCallbackRequests,
  isCallbackRequestDone,
  mapCallbackStatusFilter,
  markCallbackRequestDone,
  parseCallbackRequestList,
} from '@/services/callbackRequests'
import { colors } from '@/theme/colors'

const STATUS_FILTERS = [
  { id: 'all', label: 'All requests' },
  { id: 'pending', label: 'Pending' },
  { id: 'contacted', label: 'Contacted' },
]

const DEFAULT_APPLIED_FILTERS = {
  fromDate: '',
  toDate: '',
  status: 'ALL',
}

function formatRequestedOn(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
  if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
  if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
  return [1, '…', currentPage, '…', totalPages]
}

function Th({ children, className = '' }) {
  return (
    <th
      className={`text-left text-[10.5px] font-extrabold tracking-[0.1em] uppercase px-4 py-3.5 ${className}`}
      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      {children}
    </th>
  )
}

function DateField({ label, value, onChange, disabled }) {
  return (
    <label className="block min-w-[160px]">
      <span className="text-[11px] font-bold mb-1.5 block" style={{ color: colors.textDim }}>
        {label}
      </span>
      <div className="relative">
        <Calendar
          size={14}
          strokeWidth={1.8}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: colors.textDim }}
        />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-[11px] pl-9 pr-3 py-2.5 text-[12.5px] font-semibold text-white outline-none disabled:opacity-60"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${colors.border}`,
            colorScheme: 'dark',
          }}
        />
      </div>
    </label>
  )
}

export default function CallbackRequestsView() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_APPLIED_FILTERS)
  const [page, setPage] = useState(0)

  const [requests, setRequests] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(CALLBACK_REQUEST_PAGE_SIZE)

  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const payload = await fetchAdminCallbackRequests({
        fromDate: appliedFilters.fromDate || undefined,
        toDate: appliedFilters.toDate || undefined,
        status: appliedFilters.status,
        page,
        size: CALLBACK_REQUEST_PAGE_SIZE,
      })

      const result = parseCallbackRequestList(payload)
      setRequests(result.requests)
      setPendingCount(result.pendingCount)
      setCompletedCount(result.completedCount)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
      setPageSize(result.size)
      setPage(result.page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load callback requests')
      setRequests([])
      setPendingCount(0)
      setCompletedCount(0)
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const uiPage = page + 1
  const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1
  const rangeEnd = Math.min((page + 1) * pageSize, totalElements)
  const pageNumbers = buildPageNumbers(uiPage, totalPages)

  const applyFilters = () => {
    setAppliedFilters({
      fromDate,
      toDate,
      status: mapCallbackStatusFilter(statusFilter),
    })
    setPage(0)
  }

  const resetFilters = () => {
    setFromDate('')
    setToDate('')
    setStatusFilter('all')
    setAppliedFilters(DEFAULT_APPLIED_FILTERS)
    setPage(0)
  }

  const markAsDone = async (id) => {
    if (markingId) return

    setMarkingId(id)
    try {
      const payload = await markCallbackRequestDone(id)
      toast.success(payload?.message ?? 'Callback marked as done')
      await loadRequests()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark callback as done')
    } finally {
      setMarkingId(null)
    }
  }

  const filtersBusy = loading || markingId != null

  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-end gap-4">
          <DateField label="From date" value={fromDate} onChange={setFromDate} disabled={filtersBusy} />
          <DateField label="To date" value={toDate} onChange={setToDate} disabled={filtersBusy} />

          <label className="block min-w-[170px]">
            <span className="text-[11px] font-bold mb-1.5 block" style={{ color: colors.textDim }}>
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={filtersBusy}
              className="w-full rounded-[11px] px-3 py-2.5 text-[12.5px] font-semibold text-white outline-none cursor-pointer disabled:opacity-60"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${colors.border}`,
              }}
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.id} value={option.id} style={{ background: '#0d211a' }}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={resetFilters}
              disabled={filtersBusy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[12.5px] font-bold cursor-pointer disabled:opacity-60"
              style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
            >
              <RotateCcw size={14} strokeWidth={1.8} />
              Reset
            </button>
            <button
              type="button"
              onClick={applyFilters}
              disabled={filtersBusy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] text-[12.5px] font-extrabold cursor-pointer disabled:opacity-60"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              <Filter size={14} strokeWidth={2} />
              Apply filter
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 max-w-[420px]">
        <GlassCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>
            Pending
          </div>
          <div className="text-[24px] font-extrabold mt-1" style={{ color: colors.gold }}>
            {pendingCount.toLocaleString('en-IN')}
          </div>
        </GlassCard>
        <GlassCard className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.textDim }}>
            Completed
          </div>
          <div className="text-[24px] font-extrabold mt-1" style={{ color: colors.accent }}>
            {completedCount.toLocaleString('en-IN')}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Customer name</Th>
              <Th>Mobile number</Th>
              <Th className="min-w-[240px]">Description</Th>
              <Th>Requested on</Th>
              <Th>Status</Th>
              <Th className="text-center w-[130px]">Action</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-[13px]" style={{ color: colors.textSecondary }}>
                    <Spinner />
                    Loading callback requests…
                  </div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[13px]" style={{ color: colors.textDim }}>
                  No callback requests found for the selected filters.
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const isCompleted = isCallbackRequestDone(request.status)

                return (
                  <tr
                    key={request.id}
                    className="border-t border-white/6 transition-opacity"
                    style={{
                      opacity: isCompleted ? 0.55 : 1,
                      background: isCompleted ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className="text-[13px] font-bold"
                        style={{ color: isCompleted ? colors.textDim : '#fff' }}
                      >
                        {request.customerName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={`tel:${String(request.mobileNumber ?? '').replace(/\s/g, '')}`}
                        className="inline-flex items-center gap-2 text-[12.5px] font-semibold no-underline"
                        style={{ color: isCompleted ? colors.textDim : colors.textHighlight }}
                      >
                        <Phone size={14} strokeWidth={1.8} />
                        {request.mobileNumber}
                      </a>
                    </td>
                    <td className="px-4 py-3.5">
                      <p
                        className="text-[12.5px] leading-relaxed m-0"
                        style={{ color: isCompleted ? colors.textDim : colors.textSecondary }}
                      >
                        {request.description}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] whitespace-nowrap" style={{ color: colors.textDim }}>
                      {formatRequestedOn(request.requestedOn)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={
                          isCompleted
                            ? {
                                background: 'rgba(255,255,255,0.08)',
                                color: colors.textDim,
                                border: '1px solid rgba(255,255,255,0.12)',
                              }
                            : {
                                background: 'rgba(255,181,71,0.15)',
                                color: colors.gold,
                                border: '1px solid rgba(255,181,71,0.34)',
                              }
                        }
                      >
                        {request.statusLabel ?? (isCompleted ? 'Contacted' : 'Pending')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {isCompleted ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold"
                          style={{ color: colors.textDim }}
                        >
                          <CheckCircle2 size={14} strokeWidth={1.8} />
                          Done
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markAsDone(request.id)}
                          disabled={markingId === request.id}
                          className="px-3.5 py-2 rounded-[10px] text-[11.5px] font-extrabold cursor-pointer whitespace-nowrap disabled:opacity-60"
                          style={{
                            background: colors.primaryBtn,
                            color: colors.accentText,
                          }}
                        >
                          {markingId === request.id ? 'Saving…' : 'Mark as done'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
          style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
        >
          <div className="text-[12px]" style={{ color: colors.textSecondary }}>
            Showing {Number(rangeStart).toLocaleString('en-IN')} to {Number(rangeEnd).toLocaleString('en-IN')} of{' '}
            {Number(totalElements).toLocaleString('en-IN')} requests
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={loading || page === 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>

            {pageNumbers.map((item, index) =>
              item === '…' ? (
                <span key={`ellipsis-${index}`} className="px-1 text-[12px]" style={{ color: colors.textDim }}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(item - 1)}
                  className="min-w-8 h-8 px-2 rounded-[9px] text-[12px] font-extrabold cursor-pointer disabled:opacity-40"
                  style={
                    item === uiPage
                      ? { background: colors.primaryBtn, color: colors.accentText }
                      : { color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }
                  }
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={loading || page >= totalPages - 1}
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              className="w-8 h-8 rounded-[9px] flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: colors.textMuted, border: `1px solid ${colors.borderSubtle}` }}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
