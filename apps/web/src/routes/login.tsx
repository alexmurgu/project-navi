import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useAuthStore } from '../store/useAuthStore'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { fetchSession } = useAuthStore()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || 'Invalid email or password')
        setLoading(false)
      } else {
        await fetchSession()
        navigate({ to: '/' })
      }
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background text-foreground antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground rounded-xl shadow-sm">
            <span className="text-2xl font-bold">N</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-foreground">
          Project Navi
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="rounded-2xl shadow-sm border bg-card p-2">
          <CardHeader>
            <CardTitle className="sr-only">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-lg shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-lg shadow-sm"
                />
              </div>

              {error && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg shadow-sm font-medium transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
