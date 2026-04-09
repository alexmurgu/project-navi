import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ImportContent } from '@/import-content'
import { useAuthStore } from '../store/useAuthStore'
import { useEffect } from 'react'

export const Route = createFileRoute('/import')({ component: ImportPage })

function ImportPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (!user) navigate({ to: '/login' }) }, [user, navigate])

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const res = await axios.get('/api/dashboard'); return res.data; },
    enabled: !!user,
  })

  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>
  if (!user || !data) return null

  return (
    <ImportContent 
      users={data.users} 
      expenseCategories={data.expenseCategories} 
      incomeCategories={data.incomeCategories} 
      categoryConfigs={data.categoryConfigs} 
      currentUserId={user.id} 
    />
  )
}
