'use client'
import RoleGuard from '@/components/RoleGuard'

export default function WorkTimeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      {children}
    </RoleGuard>
  )
}
