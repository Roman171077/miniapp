//src\components\AppGuard.tsx
'use client'
import { useUserRole } from '@/context/UserRoleContext'
import Header from './Header'
import FullScreenLoader from './FullScreenLoader'

export default function AppGuard({ children }: { children: React.ReactNode }) {
  const { role, loading } = useUserRole()

  if (loading) return <FullScreenLoader />
  if (!role) return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-3">Доступ запрещён</h1>
      <p>
        Пожалуйста, откройте приложение через Telegram или обратитесь к администратору.
      </p>
    </div>
  )
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
    </>
  )
}
