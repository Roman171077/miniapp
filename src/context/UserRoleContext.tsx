'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Executor = {
  exec_id: number
  surname: string
  name: string | null
  phone: string | null
  id_telegram: number | null
  role: 'admin' | 'user'
}

type UserRoleContextType = {
  role: Executor['role'] | null
  loading: boolean
}

const UserRoleContext = createContext<UserRoleContextType>({
  role: null,
  loading: true,
})

export function useUserRole() {
  return useContext(UserRoleContext)
}

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Executor['role'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Локальная отладка или обход проверки
    if (
      (typeof window !== "undefined" &&
        ['localhost', '127.0.0.1'].includes(window.location.hostname)) ||
      process.env.NEXT_PUBLIC_BYPASS_GUARD === '1'
    ) {
      console.log('[UserRoleProvider] bypass guard', {
        host: typeof window !== 'undefined' ? window.location.hostname : 'server',
        env: process.env.NEXT_PUBLIC_BYPASS_GUARD,
      })
      setRole('admin') // для разработки считаем админом
      setLoading(false)
      return
    }

    const tg = (window as any).Telegram?.WebApp
    if (!tg) {
      console.log('[UserRoleProvider] Telegram WebApp not found')
      setRole(null)
      setLoading(false)
      return
    }

    tg.ready()
    const user = tg.initDataUnsafe?.user
    if (!user?.id) {
      console.log('[UserRoleProvider] user id missing')
      setRole(null)
      setLoading(false)
      return
    }

    const API = process.env.NEXT_PUBLIC_API_URL
    console.log('[UserRoleProvider] fetching role for user', user.id)
    fetch(`${API}/me`, {
      headers: { 'X-User-Id': String(user.id) },
    })
      .then(res => {
        console.log('[UserRoleProvider] fetch /me status', res.status)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<Executor>
      })
      .then(executor => {
        console.log('[UserRoleProvider] role from API', executor.role)
        setRole(executor.role)
      })
      .catch(err => {
        console.error('[UserRoleProvider] error fetching role', err)
        setRole(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <UserRoleContext.Provider value={{ role, loading }}>
      {children}
    </UserRoleContext.Provider>
  )
}
