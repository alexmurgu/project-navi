import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { CategoriesContent } from '@/admin/categories-content'
import { useAuthStore } from '../../store/useAuthStore'
import type { CategoryConfig } from '@/lib/category-visuals'

export const Route = createFileRoute('/admin/categories')({ component: AdminCategories })

function AdminCategories() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const res = await axios.get('/api/dashboard'); return res.data; },
    enabled: !!user,
  })

  if (!user) return <Navigate to="/login" replace />
  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>
  if (!data) return null

  const configMap: Record<string, CategoryConfig> = {}
  data.categoryConfigs.forEach((c: any) => { configMap[c.name] = c })

  return (
    <CategoriesContent 
      expenseCategories={data.expenseCategories} 
      incomeCategories={data.incomeCategories} 
      configMap={configMap} 
    />
  )
}
