import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { colors } from '../../theme/colors'

export default function OwnerLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.bg, color: colors.text }}>
      <Sidebar />
      <div className="flex-1 h-full overflow-y-auto flex flex-col relative owner-scroll">
        <TopBar />
        <main className="flex-1 px-9 pt-[30px] pb-[60px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
