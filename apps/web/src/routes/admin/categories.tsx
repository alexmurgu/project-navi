import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { CategoriesContent } from '@/admin/categories-content'
import { useAuthStore } from '../../store/useAuthStore'
import { useEffect } from 'react'

export const Route = createFileRoute('/admin/categories')({ component: AdminCategories })

function AdminCategories() {
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

  const configMap: Record<string, { id: string; name: string; color: string }> = {}
  data.categoryConfigs.forEach((c: any) => { configMap[c.name] = c })

  return (
    <CategoriesContent 
      expenseCategories={data.expenseCategories} 
      incomeCategories={data.incomeCategories} 
      configMap={configMap} 
    />
  )
}
