import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Pencil,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react'
import GlassCard from '../../components/GlassCard'
import { ModalSelect } from '../../components/PortalModal'
import Spinner from '@/components/ui/Spinner'
import { useAdminDoctorsQuery } from '../../hooks/useAdminDoctorsQuery'
import { useMedicalSpecialties } from '@/hooks/useMedicalSpecialties'
import {
  DOCTOR_STATUS_FILTERS,
  DOCTORS_PAGE_SIZE,
  doctorInitials,
  getDoctorTimingRows,
  statusMeta,
} from './doctorUtils'
import ConsultationBookingsModal from './ConsultationBookingsModal'
import DoctorStatusActions from './DoctorStatusActions'
import SpecialtyManagementModal from './SpecialtyManagementModal'
import { colors } from '@/theme/colors'

const METRIC_CARD_TONES = {
  blueWhite: {
    bg: 'rgba(59,130,246,0.16)',
    border: 'rgba(96,165,250,0.32)',
    icon: '#ffffff',
  },
  green: {
    bg: 'rgba(64,222,170,0.16)',
    border: 'rgba(64,222,170,0.34)',
    icon: colors.accent,
  },
  blue: {
    bg: 'rgba(59,130,246,0.16)',
    border: 'rgba(96,165,250,0.32)',
    icon: colors.blue,
  },
  orange: {
    bg: 'rgba(255,138,128,0.14)',
    border: 'rgba(255,138,128,0.34)',
    icon: '#ff9f7a',
  },
  purple: {
    bg: 'rgba(168,85,247,0.16)',
    border: 'rgba(196,181,253,0.32)',
    icon: '#c4b5fd',
  },
}

function MetricCard({ label, value, hint, hintAccent = false, icon: Icon, actionLabel, onAction, tone = 'green' }) {
  const meta = METRIC_CARD_TONES[tone] ?? METRIC_CARD_TONES.green

  return (
    <GlassCard className="px-3.5 py-3 flex flex-col">
      <div className="flex items-start gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
        >
          <Icon size={15} style={{ color: meta.icon }} />
        </div>
        <div className="flex-1 min-w-0 text-[11px] font-semibold leading-snug" style={{ color: colors.textSecondary }}>
          {label}
        </div>
      </div>
      <div className="text-[20px] font-extrabold tracking-tight mt-2 tabular-nums text-white leading-none">{value}</div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-1.5 text-left text-[10.5px] font-bold cursor-pointer hover:underline"
          style={{ color: colors.accent }}
        >
          {actionLabel}
        </button>
      ) : hint ? (
        <div
          className="text-[10.5px] font-semibold mt-1.5 leading-snug"
          style={{ color: hintAccent ? colors.accent : colors.textDim }}
        >
          {hint}
        </div>
      ) : null}
    </GlassCard>
  )
}

function Th({ children, className = '', align = 'left' }) {
  return (
    <th
      className={`${
        align === 'center' ? 'text-center' : 'text-left'
      } text-[10.5px] font-extrabold tracking-[0.1em] uppercase px-4 py-3.5 ${className}`}
      style={{ color: colors.textDim, borderBottom: `1px solid ${colors.borderSubtle}` }}
    >
      {children}
    </th>
  )
}

export default function DoctorsList() {
  const navigate = useNavigate()
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)
  const [search, setSearch] = useState('')
  const [specialtyId, setSpecialtyId] = useState('all')
  const [status, setStatus] = useState('active')
  const [page, setPage] = useState(0)
  const [specialtiesOpen, setSpecialtiesOpen] = useState(false)
  const [bookingsOpen, setBookingsOpen] = useState(false)
  const { specialties } = useMedicalSpecialties()
  const {
    doctors,
    summary,
    loading,
    error,
    reload,
    totalElements,
    totalPages,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
  } = useAdminDoctorsQuery({ search, specialtyId, status, page, pageSize: DOCTORS_PAGE_SIZE })

  useEffect(() => {
    if (prevPathRef.current !== '/owner/doctors' && location.pathname === '/owner/doctors') {
      reload()
    }
    prevPathRef.current = location.pathname
  }, [location.pathname, reload])

  const specialtyOptions = useMemo(
    () => [
      { value: 'all', label: 'All Specialties' },
      ...specialties.map((s) => ({ value: String(s.id), label: s.label })),
    ],
    [specialties],
  )
  const statusOptions = useMemo(
    () => DOCTOR_STATUS_FILTERS.map((opt) => ({ value: opt.id, label: opt.label })),
    [],
  )
  const resetFilters = () => {
    setSearch('')
    setSpecialtyId('all')
    setStatus('active')
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 flex-1 min-w-0">
          <MetricCard
            label="Total Doctors"
            value={summary.totalDoctors}
            hint={`+${summary.addedThisMonth} this month`}
            hintAccent
            icon={Users}
            tone="blueWhite"
          />
          <MetricCard
            label="Available Today"
            value={summary.availableToday}
            actionLabel="View schedule →"
            onAction={() => document.getElementById('doctors-table')?.scrollIntoView({ behavior: 'smooth' })}
            icon={Clock3}
            tone="blue"
          />
          <MetricCard
            label="Total Specialties"
            value={summary.totalSpecialties}
            actionLabel="Manage specialties →"
            onAction={() => setSpecialtiesOpen(true)}
            icon={CalendarDays}
            tone="orange"
          />
          <MetricCard
            label={
              <>
                Consultation Booking
                <br />
                Today
              </>
            }
            value={summary.bookingsToday}
            actionLabel="View details →"
            onAction={() => setBookingsOpen(true)}
            icon={CalendarCheck}
            tone="purple"
          />
        </div>
        <button
          type="button"
          onClick={() => navigate('/owner/doctors/add')}
          className="inline-flex items-center justify-center gap-1.5 rounded-[14px] px-6 py-3 text-[13px] font-extrabold cursor-pointer whitespace-nowrap self-start xl:self-auto flex-shrink-0"
          style={{
            background: colors.accent,
            color: colors.accentText,
            boxShadow: '0 6px 18px rgba(64,222,170,0.35)',
          }}
        >
          <span className="text-[16px] leading-none font-extrabold">+</span>
          Add Doctor
        </button>
      </div>

      <GlassCard id="doctors-table" className="overflow-hidden">
        <div
          className="flex flex-wrap items-center gap-3 px-4 pt-4 pb-3.5"
          style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}
        >
          <div className="flex-1 min-w-[240px]">
            <div
              className="relative flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <Search size={14} style={{ color: '#68d9b4', flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder="Search doctor by name, specialty or location..."
                className="flex-1 min-w-0 w-0 bg-transparent border-none outline-none text-white text-[12.5px] font-[inherit] pr-8 placeholder:text-[#6b9a88]"
              />
              <button
                type="button"
                onClick={() => setSearch('')}
                disabled={!search}
                tabIndex={search ? 0 : -1}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity ${
                  search ? 'opacity-100 cursor-pointer hover:bg-white/10' : 'opacity-0 pointer-events-none'
                }`}
                style={{ color: colors.textSecondary }}
                aria-label="Clear search"
                aria-hidden={!search}
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>
          </div>
          <ModalSelect
            className="w-[170px] flex-shrink-0"
            value={specialtyId}
            onChange={(e) => {
              setSpecialtyId(e.target.value)
              setPage(0)
            }}
            options={specialtyOptions}
            placeholder="All Specialties"
          />
          <ModalSelect
            className="w-[150px] flex-shrink-0"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
            options={statusOptions}
            placeholder="Available"
          />
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-1.5 rounded-[11px] px-3.5 py-2.5 text-[12px] font-bold cursor-pointer flex-shrink-0"
            style={{ color: colors.textMuted, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)' }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Spinner />
            <p className="text-[12.5px] font-bold" style={{ color: colors.textSecondary }}>Loading doctors…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-4">
            <p className="text-[13px] font-bold text-red-400">{error}</p>
            <button type="button" onClick={reload} className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-extrabold cursor-pointer" style={{ background: colors.primaryBtn, color: colors.accentText }}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {doctors.map((doctor) => {
                const badge = statusMeta(doctor.status)
                const timings = getDoctorTimingRows(doctor)
                return (
                  <div key={doctor.id} className="rounded-[14px] p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}` }}>
                    <button type="button" onClick={() => navigate(`/owner/doctors/${doctor.id}`)} className="flex items-center gap-3 text-left w-full cursor-pointer">
                      {doctor.imageUrl ? (
                        <img src={doctor.imageUrl} alt="" className="w-[40px] h-[40px] rounded-full object-cover" />
                      ) : (
                        <span className="w-[40px] h-[40px] rounded-full flex items-center justify-center font-extrabold text-[11px]" style={{ background: 'rgba(64,222,170,0.14)', color: colors.accent, border: '1px solid rgba(64,222,170,0.36)' }}>
                          {doctorInitials(doctor.name)}
                        </span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-white truncate">{doctor.name}</span>
                        <span className="block text-[10.5px] truncate" style={{ color: colors.textDim }}>{doctor.qualifications}</span>
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0" style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    </button>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div><span style={{ color: colors.textDim }}>Specialty</span><div className="font-semibold text-white mt-0.5">{doctor.specialty}</div></div>
                      <div><span style={{ color: colors.textDim }}>Store</span><div className="font-semibold text-white mt-0.5">{doctor.store}</div></div>
                    </div>
                    <div className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>
                      {timings.join(' · ')}
                    </div>
                    <div className="mt-3 flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/owner/doctors/${doctor.id}/edit`)}
                        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-white transition-colors"
                        style={{ color: colors.textSecondary }}
                        aria-label={`Edit ${doctor.name}`}
                      >
                        <Pencil size={15} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/owner/doctors/${doctor.id}`)}
                        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-white transition-colors"
                        style={{ color: colors.textSecondary }}
                        aria-label={`View ${doctor.name}`}
                      >
                        <Eye size={15} strokeWidth={1.8} />
                      </button>
                      <DoctorStatusActions doctor={doctor} onUpdated={reload} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse">
                <thead>
                  <tr>
                    <Th>Doctor</Th>
                    <Th>Specialty</Th>
                    <Th>Store</Th>
                    <Th>Consultation Timings</Th>
                    <Th>Status</Th>
                    <Th align="center">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => {
                    const badge = statusMeta(doctor.status)
                    const timings = getDoctorTimingRows(doctor)
                    return (
                      <tr key={doctor.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/owner/doctors/${doctor.id}`)}
                            className="flex items-center gap-3 text-left cursor-pointer min-w-0"
                          >
                            {doctor.imageUrl ? (
                              <img src={doctor.imageUrl} alt="" className="w-[36px] h-[36px] rounded-full object-cover flex-shrink-0" style={{ border: '1px solid rgba(64,222,170,0.28)' }} />
                            ) : (
                              <span
                                className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-extrabold text-[11px] flex-shrink-0"
                                style={{ background: 'rgba(64,222,170,0.14)', color: colors.accent, border: '1px solid rgba(64,222,170,0.36)' }}
                              >
                                {doctorInitials(doctor.name)}
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block text-[12.5px] font-bold text-white hover:underline truncate">{doctor.name}</span>
                              <span className="block text-[10.5px] truncate" style={{ color: colors.textDim }}>{doctor.qualifications}</span>
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-white">{doctor.specialty}</td>
                        <td className="px-4 py-2.5 text-[12px] text-white">{doctor.store}</td>
                        <td className="px-4 py-2.5">
                          <div className="space-y-0.5">
                            {timings.map((slot) => (
                              <div key={slot} className="text-[11.5px] whitespace-nowrap text-white">{slot}</div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center align-middle">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/owner/doctors/${doctor.id}/edit`)}
                              className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-white transition-colors"
                              style={{ color: colors.textSecondary }}
                              aria-label={`Edit ${doctor.name}`}
                            >
                              <Pencil size={15} strokeWidth={1.8} />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/owner/doctors/${doctor.id}`)}
                              className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer hover:bg-white/8 hover:text-white transition-colors"
                              style={{ color: colors.textSecondary }}
                              aria-label={`View ${doctor.name}`}
                            >
                              <Eye size={15} strokeWidth={1.8} />
                            </button>
                            <DoctorStatusActions doctor={doctor} onUpdated={reload} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {!doctors.length && (
              <div className="py-12 text-center text-[13px] font-semibold" style={{ color: colors.textDim }}>
                No doctors match your filters.
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5" style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
              <p className="text-[11.5px] font-semibold" style={{ color: colors.textDim }}>
                Showing {rangeStart} to {rangeEnd} of {totalElements} doctors
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button type="button" disabled={currentPage <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="w-8 h-8 rounded-[9px] flex items-center justify-center disabled:opacity-40 cursor-pointer" style={{ color: colors.textMuted, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)' }}>
                  <ChevronLeft size={15} />
                </button>
                {pageNumbers.map((num, index) =>
                  num === '…' ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-[12px]" style={{ color: colors.textDim }}>…</span>
                  ) : (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPage(Number(num) - 1)}
                      className="min-w-8 h-8 px-2 rounded-[9px] text-[12px] font-bold cursor-pointer"
                      style={
                        currentPage + 1 === num
                          ? { color: colors.accent, border: `1px solid ${colors.accent}`, background: 'rgba(64,222,170,0.08)' }
                          : { color: colors.textMuted, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)' }
                      }
                    >
                      {num}
                    </button>
                  ),
                )}
                <button type="button" disabled={currentPage >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="w-8 h-8 rounded-[9px] flex items-center justify-center disabled:opacity-40 cursor-pointer" style={{ color: colors.textMuted, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)' }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>

      {specialtiesOpen ? <SpecialtyManagementModal onClose={() => setSpecialtiesOpen(false)} /> : null}
      {bookingsOpen ? <ConsultationBookingsModal onClose={() => setBookingsOpen(false)} /> : null}
    </div>
  )
}
