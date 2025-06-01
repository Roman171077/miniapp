//src\components\AppAccessGuard.tsx
'use client'
import { useEffect, useState, ReactNode } from 'react'

type Executor = {
  exec_id: number
  surname: string
  name: string | null
  phone: string | null
  id_telegram: number | null
  role: 'admin' | 'user'
}

const LoadingMessage = () => (
  <div className="p-6 text-center">
    <img src="/mvm.jpg" alt="Загрузка..." className="w-full h-auto object-contain" />
  </div>
)

const AccessDeniedMessage = () => (
  <div className="p-6">
    <h1 className="text-2xl font-semibold mb-3">Доступ запрещён</h1>
    <p>
      Пожалуйста, откройте приложение через Telegram или обратитесь к администратору.
    </p>
  </div>
)

export default function AppAccessGuard({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<null | boolean>(null) // null = loading, true = ok, false = denied

  useEffect(() => {
    // Разрешить локальную разработку или тест по переменной окружения
    if (
      (typeof window !== "undefined" &&
        ['localhost', '127.0.0.1'].includes(window.location.hostname)) ||
      process.env.NEXT_PUBLIC_BYPASS_GUARD === '1'
    ) {
      setAccess(true)
      return
    }

    // Далее — обычная Telegram-проверка
    const tg = (window as any).Telegram?.WebApp
    if (!tg) {
      setAccess(false)
      return
    }

    tg.ready()
    const user = tg.initDataUnsafe?.user
    if (!user?.id) {
      setAccess(false)
      return
    }

    const API = process.env.NEXT_PUBLIC_API_URL
    fetch(`${API}/me`, { headers: { 'X-User-Id': String(user.id) } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((executor: Executor) => {
        setAccess(!!executor.role)
      })
      .catch(() => setAccess(false))
  }, [])

  if (access === null) return <LoadingMessage />
  if (access === false) return <AccessDeniedMessage />
  
  return <>{children}</>
}
