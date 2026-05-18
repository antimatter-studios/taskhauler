// Placeholder shell — to be replaced by the agents building primitives + Board components.
// This just confirms the v2 container boots and reaches the API.
import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/authStore'
import LoginForm from './components/LoginForm'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function App() {
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const logout = useAuthStore((s) => s.logout)
  const [booted, setBooted] = useState(false)
  const [health, setHealth] = useState<string>('checking...')

  useEffect(() => {
    fetchMe().finally(() => setBooted(true))
  }, [fetchMe])

  useEffect(() => {
    fetch('/api/v1/health')
      .then((r) => r.json())
      .then((d) => setHealth(JSON.stringify(d)))
      .catch((e) => setHealth('error: ' + String(e)))
  }, [])

  if (!booted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <LoginForm />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden p-8">
      <h1 className="text-2xl font-semibold">taskhauler-v2 (bootstrap)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Hello {user.display_name || user.email}. The real UI is being assembled by parallel agents.
      </p>
      <p className="mt-2 text-xs">
        Backend health: <code className="rounded bg-muted px-1">{health}</code>
      </p>
      <Button className="mt-4 w-fit" variant="outline" size="sm" onClick={logout}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  )
}
