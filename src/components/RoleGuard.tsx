'use client'
import { ReactNode } from 'react'
import { useUserRole } from '@/context/UserRoleContext'

export default function RoleGuard({ role: required, children }:{ role: 'admin' | 'user'; children: ReactNode }) {
  const { role, loading } = useUserRole()
  if (loading) {
    return <div className="p-6">Загрузка...</div>
  }
  if (role !== required) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-3">Доступ запрещён</h1>
        <p>Только {required} может видеть эту страницу.</p>
      </div>
    )
  }
  return <>{children}</>
}
