'use client'
import { ReactNode } from 'react'
import { useUserRole } from '@/context/UserRoleContext'
import FullScreenLoader from './FullScreenLoader'

export default function RoleGuard({ allowed, children }: { allowed: string | string[]; children: ReactNode }) {
  const { role, loading } = useUserRole()
  if (loading) return <FullScreenLoader />
  if (!role || (Array.isArray(allowed) ? !allowed.includes(role) : role !== allowed)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-3">Доступ запрещён</h1>
        <p>Недостаточно прав для просмотра этой страницы.</p>
      </div>
    )
  }
  return <>{children}</>
}
