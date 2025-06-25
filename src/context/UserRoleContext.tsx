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
  userId: number | null
  loading: boolean
}

const UserRoleContext = createContext<UserRoleContextType>({
  role: null,
  userId: null,
  loading: true,
})

export function useUserRole() {
  return useContext(UserRoleContext)
}

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Executor['role'] | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Локальная отладка или обход проверки
    if (
      (typeof window !== "undefined" &&
        ['localhost', '127.0.0.1'].includes(window.location.hostname)) ||
      process.env.NEXT_PUBLIC_BYPASS_GUARD === '1'
    ) {
      setRole('admin') // для разработки считаем админом
      setUserId(1)
      setLoading(false)
      return
    }

    const tg = (window as any).Telegram?.WebApp
    if (!tg) {
      setRole(null)
      setUserId(null)
      setLoading(false)
      return
    }

    tg.ready()
    const user = tg.initDataUnsafe?.user
    if (!user?.id) {
      setRole(null)
      setUserId(null)
      setLoading(false)
      return
    }
    setUserId(user.id)

    const API = process.env.NEXT_PUBLIC_API_URL
    fetch(`${API}/me`, {
      headers: { 'X-User-Id': String(user.id) },
    })
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<Executor>
      })
      .then(executor => {
        setRole(executor.role)
      })
      .catch(() => {
        setRole(null)
        setUserId(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <UserRoleContext.Provider value={{ role, userId, loading }}>
      {children}
    </UserRoleContext.Provider>
  )
}
