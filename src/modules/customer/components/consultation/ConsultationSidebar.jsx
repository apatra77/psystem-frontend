import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Crosshair,
  FileText,
  Headphones,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { PATHS } from '@/app/router/paths'
import { CONSULTATION_SIDEBAR_IMAGES, CONSULTATION_WHY_US } from '@/shared/mocks/doctorConsultation'
import { colors } from '@/app/themes/colors'

const WHY_ICONS = {
  user: UserRound,
  consult: Stethoscope,
  calendar: CalendarDays,
  prescription: FileText,
  care: Crosshair,
}

function IconTile({ children }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
      style={{
        background: 'rgba(64,222,170,0.14)',
        border: '1px solid rgba(64,222,170,0.22)',
        color: colors.accent,
      }}
    >
      {children}
    </span>
  )
}

export default function ConsultationSidebar() {
  return (
    <aside className="w-full xl:sticky xl:top-[84px] xl:self-start">
      <div className="space-y-4">
        {/* Expert care banner — matches design mock */}
        <div
          className="overflow-hidden rounded-[22px]"
          style={{ border: '1px solid rgba(64,222,170,0.1)' }}
        >
          <img
            src={CONSULTATION_SIDEBAR_IMAGES.expertCareBanner}
            alt="Expert care for a healthier you — consult from home, verified doctors, secure and confidential"
            className="block h-auto w-full"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Why consult with us */}
        <div
          className="rounded-[18px] px-4 py-4"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <p className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>
            Why consult with us?
          </p>
          <ul className="mt-3.5 space-y-3">
            {CONSULTATION_WHY_US.map((item) => {
              const Icon = WHY_ICONS[item.icon] ?? UserRound
              return (
                <li key={item.label} className="flex items-center gap-3">
                  <IconTile>
                    <Icon size={16} strokeWidth={2.1} />
                  </IconTile>
                  <span className="text-[12px] leading-snug" style={{ color: colors.textMuted }}>
                    {item.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Need help */}
        <div
          className="rounded-[18px] px-4 py-4"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <div className="flex items-start gap-3">
            <IconTile>
              <Headphones size={16} strokeWidth={2.1} />
            </IconTile>
            <div>
              <p className="text-[14px] font-extrabold" style={{ color: colors.textBright }}>
                Need help?
              </p>
              <p className="mt-1 text-[12px] leading-relaxed" style={{ color: colors.textMuted }}>
                Talk to our support team
              </p>
            </div>
          </div>
          <Link
            to={PATHS.customer.contact}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[12px] font-extrabold transition-colors hover:bg-[rgba(64,222,170,0.06)]"
            style={{
              color: colors.accent,
              border: '1px solid rgba(64,222,170,0.35)',
              background: 'rgba(64,222,170,0.04)',
            }}
          >
            Contact Us
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
