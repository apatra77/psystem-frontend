import { useState } from 'react'
import Header from '../components/landing/Header'
import Hero from '../components/landing/Hero'
import Stats from '../components/landing/Stats'
import Features from '../components/landing/Features'
import Testimonials from '../components/landing/Testimonials'
import CtaBanner from '../components/landing/CtaBanner'
import Footer from '../components/landing/Footer'
import AuthModal from '../components/modals/AuthModal'
import DownloadModal from '../components/modals/DownloadModal'
import { colors } from '../theme/colors'

export default function LandingPage() {
  const [modal, setModal] = useState(null)

  const openAuth = () => setModal('auth')
  const openDownload = () => setModal('download')

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        fontFamily: "'Manrope', sans-serif",
        background: colors.pageBg,
        color: colors.text,
      }}
    >
      <Header onAuth={openAuth} onDownload={openDownload} />
      <Hero onAuth={openAuth} onDownload={openDownload} />
      <Stats />
      <Features />
      <Testimonials />
      <CtaBanner onAuth={openAuth} onDownload={openDownload} />
      <Footer />

      {modal === 'auth' && <AuthModal onClose={() => setModal(null)} />}
      {modal === 'download' && <DownloadModal onClose={() => setModal(null)} />}
    </div>
  )
}
