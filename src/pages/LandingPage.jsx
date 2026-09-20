import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/landing/Header'
import Hero from '../components/landing/Hero'
import Features from '../components/landing/Features'
import CtaBanner from '../components/landing/CtaBanner'
import Footer from '../components/landing/Footer'
import AuthModal from '../components/modals/AuthModal'
import DownloadModal from '../components/modals/DownloadModal'
import CallbackRequestModal from '@/modules/customer/components/CallbackRequestModal'
import { getPostLoginPath, getStoredAuthUser, isOwnerRole } from '../services/auth'
import { colors } from '../theme/colors'

const DEFAULT_CUSTOMER_PATH = '/customer'

export default function LandingPage() {
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const [authRedirectPath, setAuthRedirectPath] = useState(DEFAULT_CUSTOMER_PATH)

  const openAuth = (redirectPath = DEFAULT_CUSTOMER_PATH) => {
    const user = getStoredAuthUser()
    if (user && !isOwnerRole(user.role)) {
      navigate(redirectPath || getPostLoginPath(user))
      return
    }
    setAuthRedirectPath(redirectPath || DEFAULT_CUSTOMER_PATH)
    setModal('auth')
  }

  const openDownload = () => setModal('download')
  const openCallback = () => setModal('callback')

  const closeAuth = () => {
    setModal(null)
    setAuthRedirectPath(DEFAULT_CUSTOMER_PATH)
  }

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        fontFamily: "'Manrope', sans-serif",
        background: colors.pageBg,
        color: colors.text,
      }}
    >
      <Header onAuth={() => openAuth()} onNav={openAuth} onDownload={openDownload} onCallback={openCallback} />
      <Hero onAuth={openAuth} onDownload={openDownload} />
      <Features />
      <CtaBanner onAuth={openAuth} onDownload={openDownload} />
      <Footer />

      {modal === 'auth' && <AuthModal onClose={closeAuth} redirectPath={authRedirectPath} />}
      {modal === 'download' && <DownloadModal onClose={() => setModal(null)} />}
      {modal === 'callback' && <CallbackRequestModal onClose={() => setModal(null)} />}
    </div>
  )
}
