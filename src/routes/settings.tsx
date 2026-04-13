import { createFileRoute, Navigate } from '@tanstack/react-router'
import { SettingsContent } from '@/settings-content'
import { useRequireAuth } from '@/hooks/use-auth-guard'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

function SettingsPage() {
  const { user, loading } = useRequireAuth()

  if (loading) return <div className="p-8 text-foreground">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  return <SettingsContent />
}
