import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { getActiveBrandProfile } from '../config/brand'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function AppLayout() {
  const brandProfile = getActiveBrandProfile()
  const authStorageKey = useMemo(() => `auth_ok_${brandProfile.id}_v1`, [brandProfile.id])

  const expectedUsername = String(import.meta.env.VITE_LOGIN_USERNAME || '').trim()
  const expectedPassword = String(import.meta.env.VITE_LOGIN_PASSWORD || '')
  const loginEnabled = expectedUsername.length > 0 && expectedPassword.length > 0

  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!loginEnabled) {
      setIsAuthed(true)
      setIsAuthReady(true)
      return
    }

    const existing = window.localStorage.getItem(authStorageKey)
    setIsAuthed(existing === '1')
    setIsAuthReady(true)
  }, [authStorageKey, loginEnabled])

  function handleLoginSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = username.trim() === expectedUsername && password === expectedPassword
    if (!ok) {
      setErrorMsg('Credenziali non valide')
      return
    }
    window.localStorage.setItem(authStorageKey, '1')
    setErrorMsg('')
    setIsAuthed(true)
    setPassword('')
  }

  function handleLogout() {
    window.localStorage.removeItem(authStorageKey)
    setIsAuthed(false)
    setUsername('')
    setPassword('')
  }

  if (!isAuthReady) {
    return null
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="w-full max-w-md card">
          <div
            className="rounded-[10px] p-4 border"
            style={{ backgroundColor: brandProfile.pdfTheme.soft, borderColor: brandProfile.pdfTheme.accent }}
          >
            <img src={brandProfile.logoAsset} alt={brandProfile.label} className="h-8 w-auto" />
            <div className="mt-2 text-sm text-gray-700">Accesso riservato {brandProfile.label}</div>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleLoginSubmit}>
            <div>
              <label className="text-xs text-gray-500">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {errorMsg ? <div className="text-xs text-red-600">{errorMsg}</div> : null}
            <Button type="submit" className="w-full">Accedi</Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="container-page py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight"><img
            src={brandProfile.logoAsset}
            alt={brandProfile.label}
            className="h-7 w-auto md:h-8 select-none pointer-events-none"
          /></Link>
          <nav className="text-sm text-gray-600 flex items-center gap-3">
            <span>versione 0.1</span>
            {loginEnabled ? (
              <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={handleLogout}>Esci</button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="container-page py-6">
        <Outlet />
      </main>
    </div>
  )
}