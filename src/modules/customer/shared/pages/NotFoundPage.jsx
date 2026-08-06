import { Link } from 'react-router-dom'
import Button from '@/shared/ui/Button'
import { useAuthStore } from '@/app/store/authStore'
import { homePathForRole } from '@/app/router/roleHome'
import { msg } from '@/shared/messages/messages'
import { colors } from '@/app/themes/colors'

export default function NotFoundPage() {
  const role = useAuthStore((s) => s.role)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: colors.pageBg }}>
      <p className="text-[54px] font-extrabold" style={{ color: colors.accent }}>404</p>
      <p className="text-[15px]" style={{ color: colors.textMuted }}>{msg('common.notFound')}</p>
      <Button as={Link} to={homePathForRole(role)} size="lg">Take me home</Button>
    </div>
  )
}
