import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, ChevronLeft, ChevronRight, X } from 'lucide-react'
import PortalModal, { ModalFieldLabel, ModalInput } from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { fetchAdminConsultationBookings, todayApiDate } from '@/services/adminAppointments'
import { buildPageNumbers } from './doctorUtils'
import { colors } from '@/theme/colors'

const BOOKINGS_PAGE_SIZE = 10

function formatDisplayDate(dateValue) {
  if (!dateValue) return '—'
  const parsed = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeRange(booking) {
  if (booking.timeRange) return booking.timeRange
  if (booking.startTime && booking.endTime) {
    return `${booking.startTime.slice(0, 5)} – ${booking.endTime.slice(0, 5)}`
  }
  if (booking.startTime) return booking.startTime.slice(0, 5)
  return '—'
}

function statusStyle(status = '') {
  const value = String(status).toUpperCase()
  if (value === 'CONFIRMED' || value === 'BOOKED' || value === 'SCHEDULED') {
    return { color: colors.accent, bg: 'rgba(64,222,170,0.12)', border: 'rgba(64,222,170,0.32)' }
  }
  if (value === 'CANCELLED' || value === 'CANCELED') {
    return { color: '#ff8a80', bg: 'rgba(255,138,128,0.12)', border: 'rgba(255,138,128,0.32)' }
  }
  if (value === 'COMPLETED') {
    return { color: '#93c5fd', bg: 'rgba(59,130,246,0.12)', border: 'rgba(96,165,250,0.32)' }
  }
  return { color: colors.textMuted, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.14)' }
}

function Th({ children, align = 'left' }) {
  return (
    <th
      className={`${
        align === 'center' ? 'text-center' : 'text-left'
      } text-[10.5px] font-extrabold tracking-[0.1em] uppercase px-4 py-3`}
      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      {children}
    </th>
  )
}

export default function ConsultationBookingsModal({ onClose }) {
  const today = todayApiDate()
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [appliedFrom, setAppliedFrom] = useState(today)
  const [appliedTo, setAppliedTo] = useState(today)
  const [page, setPage] = useState(0)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadBookings = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await fetchAdminConsultationBookings({
          fromDate: appliedFrom || todayApiDate(),
          toDate: appliedTo || appliedFrom || todayApiDate(),
          page,
          size: BOOKINGS_PAGE_SIZE,
        })
        if (cancelled) return
        setBookings(result.bookings)
        setTotalElements(result.totalElements)
        setTotalPages(Math.max(1, result.totalPages))
        setCurrentPage(result.page)
      } catch (err) {
        if (cancelled) return
        setBookings([])
        setTotalElements(0)
        setTotalPages(1)
        setCurrentPage(0)
        setError(err instanceof Error ? err.message : 'Could not load consultation bookings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBookings()

    return () => {
      cancelled = true
    }
  }, [appliedFrom, appliedTo, page, reloadKey])

  const applyFilters = () => {
    const nextFrom = fromDate || todayApiDate()
    const nextTo = toDate || nextFrom
    setAppliedFrom(nextFrom)
    setAppliedTo(nextTo >= nextFrom ? nextTo : nextFrom)
    setPage(0)
  }

  const resetToToday = () => {
    const value = todayApiDate()
    setFromDate(value)
    setToDate(value)
    setAppliedFrom(value)
    setAppliedTo(value)
    setPage(0)
  }

  const rangeStart = totalElements ? currentPage * BOOKINGS_PAGE_SIZE + 1 : 0
  const rangeEnd = Math.min(totalElements, (currentPage + 1) * BOOKINGS_PAGE_SIZE)
  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage + 1, totalPages),
    [currentPage, totalPages],
  )

  const dateSummary =
    appliedFrom === appliedTo
      ? formatDisplayDate(appliedFrom)
      : `${formatDisplayDate(appliedFrom)} – ${formatDisplayDate(appliedTo)}`

  return (
    <PortalModal onClose={onClose} width={920} scrollable={false}>
      <div className="flex flex-col max-h-[88vh]">
        <div
          className="flex-shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.09)' }}
        >
          <div>
            <h2 className="text-[17px] font-extrabold text-white">Consultation Bookings</h2>
            <p className="text-[12px] mt-1" style={{ color: colors.textDim }}>
              View and filter consultation bookings by date range.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/8 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} style={{ color: colors.textMuted }} />
          </button>
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.09)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <div>
            <ModalFieldLabel>From date</ModalFieldLabel>
            <ModalInput
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <ModalFieldLabel>To date</ModalFieldLabel>
            <ModalInput
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-[10px] px-4 py-2 text-[12.5px] font-extrabold cursor-pointer whitespace-nowrap"
            style={{ background: colors.accent, color: colors.accentText }}
          >
            Apply filter
          </button>
          <button
            type="button"
            onClick={resetToToday}
            className="rounded-[10px] px-4 py-2 text-[12.5px] font-bold cursor-pointer whitespace-nowrap"
            style={{
              color: colors.textMuted,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            Today
          </button>
        </div>
          <p className="text-[11px] font-semibold mt-3" style={{ color: colors.textDim }}>
            Showing bookings for {dateSummary}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto owner-scroll min-h-0 px-5 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <Spinner />
            <p className="text-[12.5px] font-bold" style={{ color: colors.textSecondary }}>
              Loading bookings…
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-[13px] font-bold text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer"
              style={{ background: colors.primaryBtn, color: colors.accentText }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {bookings.map((booking) => {
                const badge = statusStyle(booking.status)
                return (
                  <div
                    key={booking.id || booking.code}
                    className="rounded-[14px] p-3.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-white truncate">{booking.patientName || 'Patient'}</div>
                        <div className="text-[11.5px] mt-0.5 truncate" style={{ color: colors.textDim }}>
                          {booking.doctorName || 'Doctor'}
                          {booking.specialty ? ` · ${booking.specialty}` : ''}
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}
                      >
                        {booking.statusLabel || booking.status || '—'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span style={{ color: colors.textDim }}>Date</span>
                        <div className="font-semibold text-white mt-0.5">{formatDisplayDate(booking.date)}</div>
                      </div>
                      <div>
                        <span style={{ color: colors.textDim }}>Time</span>
                        <div className="font-semibold text-white mt-0.5">{formatTimeRange(booking)}</div>
                      </div>
                      <div>
                        <span style={{ color: colors.textDim }}>Phone</span>
                        <div className="font-semibold text-white mt-0.5">{booking.patientPhone || '—'}</div>
                      </div>
                      <div>
                        <span style={{ color: colors.textDim }}>Fee</span>
                        <div className="font-semibold text-white mt-0.5">{booking.feeLabel || '—'}</div>
                      </div>
                    </div>
                    {booking.code ? (
                      <div className="mt-2 text-[10.5px] font-semibold" style={{ color: colors.textDim }}>
                        Ref: {booking.code}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div className="hidden md:block overflow-x-auto owner-scroll rounded-[12px]" style={{ border: `1px solid ${colors.borderSubtle}` }}>
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr>
                    <Th>Patient</Th>
                    <Th>Doctor</Th>
                    <Th>Date</Th>
                    <Th>Time</Th>
                    <Th>Phone</Th>
                    <Th>Fee</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const badge = statusStyle(booking.status)
                    return (
                      <tr key={booking.id || booking.code} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="text-[12.5px] font-bold text-white">{booking.patientName || '—'}</div>
                          {booking.code ? (
                            <div className="text-[10.5px] mt-0.5" style={{ color: colors.textDim }}>
                              {booking.code}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[12px] text-white">{booking.doctorName || '—'}</div>
                          {booking.specialty ? (
                            <div className="text-[10.5px] mt-0.5" style={{ color: colors.textDim }}>
                              {booking.specialty}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-white whitespace-nowrap">
                          {formatDisplayDate(booking.date)}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-white whitespace-nowrap">
                          {formatTimeRange(booking)}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-white whitespace-nowrap">
                          {booking.patientPhone || '—'}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-white whitespace-nowrap">
                          {booking.feeLabel || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}
                          >
                            {booking.statusLabel || booking.status || '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {!bookings.length && (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <CalendarClock size={28} style={{ color: colors.textDim }} />
                <p className="text-[13px] font-semibold" style={{ color: colors.textDim }}>
                  No consultation bookings found for this date range.
                </p>
              </div>
            )}

            {bookings.length > 0 && (
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4"
                style={{ borderTop: `1px solid ${colors.borderSubtle}` }}
              >
                <p className="text-[11.5px] font-semibold" style={{ color: colors.textDim }}>
                  Showing {rangeStart} to {rangeEnd} of {totalElements} bookings
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={currentPage <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    style={{
                      color: colors.textMuted,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {pageNumbers.map((num, index) =>
                    num === '…' ? (
                      <span key={`ellipsis-${index}`} className="px-1 text-[12px]" style={{ color: colors.textDim }}>
                        …
                      </span>
                    ) : (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPage(Number(num) - 1)}
                        className="min-w-8 h-8 px-2 rounded-[9px] text-[12px] font-bold cursor-pointer"
                        style={
                          currentPage + 1 === num
                            ? {
                                color: colors.accent,
                                border: `1px solid ${colors.accent}`,
                                background: 'rgba(64,222,170,0.08)',
                              }
                            : {
                                color: colors.textMuted,
                                border: '1px solid rgba(255,255,255,0.14)',
                                background: 'rgba(255,255,255,0.03)',
                              }
                        }
                      >
                        {num}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                    style={{
                      color: colors.textMuted,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </PortalModal>
  )
}
