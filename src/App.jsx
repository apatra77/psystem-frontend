import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PortalProviders from '@/app/providers/PortalProviders'
import CustomerRouter from '@/app/router/CustomerRouter'
import OwnerRouter from '@/modules/owner/router/OwnerRouter'
import LandingPage from './pages/LandingPage'

export default function App() {
  return (
    <BrowserRouter>
      <PortalProviders>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/customer/*" element={<CustomerRouter />} />
          <Route path="/owner/*" element={<OwnerRouter />} />
        </Routes>
      </PortalProviders>
    </BrowserRouter>
  )
}
