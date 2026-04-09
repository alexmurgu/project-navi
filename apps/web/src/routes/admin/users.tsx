import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { UsersContent } from '@/admin/users-content'
import { useAuthStore } from '../../store/useAuthStore'
import { useEffect } from 'react'

export const Route = createFileRoute('/admin/users')({ component: AdminUsersPage })

function AdminUsersPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (!user) navigate({ to: '/login' }) }, [user, navigate])

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => { const res = await axios.get('/api/admin/users'); return res.data; },
    enabled: !!user,
  })

  if (isLoading) return <div className="p-8 text-foreground">Loading...</div>
  if (!user || !users) return null

  const adminEmail = "admin@example.com"

  return <UsersContent allUsers={users} adminEmail={adminEmail} currentUserEmail={user.email} />
}
