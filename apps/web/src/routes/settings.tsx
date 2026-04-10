import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { SettingsContent } from '@/settings-content'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

function SettingsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (!user) navigate({ to: '/login' }) }, [user, navigate])

  if (!user) return null

  return <SettingsContent />
}
