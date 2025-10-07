import { Outlet, Link } from 'react-router-dom'
import xInfissiLogo from '../assets/images/x-infissi-logo.png'

export default function AppLayout() {
  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="container-page py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight"><img
            src={xInfissiLogo}
            alt="X Infissi"
            className="h-7 w-auto md:h-8 select-none pointer-events-none"
          /></Link>
          <nav className="text-sm text-gray-600">versione 0.1</nav>
        </div>
      </header>
      <main className="container-page py-6">
        <Outlet />
      </main>
    </div>
  )
}