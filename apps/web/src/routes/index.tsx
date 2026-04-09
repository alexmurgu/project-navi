import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { DashboardContent } from '@/dashboard-content'
import { useAuthStore } from '../store/useAuthStore'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (!user) navigate({ to: '/login' }) }, [user, navigate])

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const res = await axios.get('/api/dashboard'); return res.data; },
    enabled: !!user,
  })

  if (isLoading) return <div className="p-8 text-foreground">Loading Dashboard...</div>
  if (error) return <div className="p-8 text-destructive">Error loading dashboard</div>
  if (!user || !data) return null

  return <DashboardContent data={data} />
}
