import { Outlet, Link } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="container-page py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">Preventivatore X</Link>
          <nav className="text-sm text-gray-600">MVP</nav>
        </div>
      </header>
      <main className="container-page py-6">
        <Outlet />
      </main>
    </div>
  )
}