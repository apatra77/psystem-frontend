import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useOwnerPage } from '../routes'
import { colors } from '@/theme/colors'

export default function OwnerLayout() {
  const page = useOwnerPage()
  const isProfilePage = page === 'profile'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.bg, color: colors.text }}>
      <Sidebar />
      <div
        className={`flex-1 h-full flex flex-col relative ${
          isProfilePage ? 'overflow-hidden' : 'overflow-y-auto owner-scroll'
        }`}
      >
        <TopBar />
        <main
          className={`flex-1 px-9 pt-[30px] min-h-0 ${
            isProfilePage ? 'pb-9 overflow-hidden flex flex-col' : 'pb-[60px]'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
