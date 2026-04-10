import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ExpensesContent } from '@/expenses-content'
import { useRequireAuth } from '@/hooks/use-auth-guard'

export const Route = createFileRoute('/expenses')({ component: ExpensesPage })

function ExpensesPage() {
  const { user, loading } = useRequireAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const res = await axios.get('/api/dashboard'); return res.data; },
    enabled: !!user,
  })

  if (loading) return <div className="p-8 text-foreground">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (isLoading) return <div className="p-8 text-foreground">Loading Expenses...</div>
  if (!data) return null

  return <ExpensesContent data={data} />
}
