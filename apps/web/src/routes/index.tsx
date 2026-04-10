import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { DashboardContent } from '@/dashboard-content'
import { useRequireAuth } from '@/hooks/use-auth-guard'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const { user, loading } = useRequireAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const res = await axios.get('/api/dashboard'); return res.data; },
    enabled: !!user,
  })

  if (loading) return <div className="p-8 text-foreground">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (isLoading) return <div className="p-8 text-foreground">Loading Dashboard...</div>
  if (error) return <div className="p-8 text-destructive">Error loading dashboard</div>
  if (!data) return null

  return <DashboardContent data={data} />
}
