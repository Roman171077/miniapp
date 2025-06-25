//src\components\Header.tsx
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useUserRole } from '@/context/UserRoleContext'

export default function Header() {
  const [open, setOpen] = useState(false)
  const { role, loading } = useUserRole()

  // Пока не определена роль — не показываем меню вообще
  if (loading) return null
  if (!role) return null

  const links = [
    { href: '/', label: 'Главная', show: true },
    { href: "/table", label: "Табель", show: true }, // добавляем ссылку на таблицу
    { href: '/tasks', label: 'Задачи', show: true },
    { href: '/map', label: 'Карта', show: true },
    { href: '/subscribers', label: 'Абоненты', show: true },
    { href: '/work-time', label: 'Время', show: role === 'admin' },
  ].filter(l => l.show)

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-zinc-900 backdrop-blur">
        <Link href="/" className="text-lg font-semibold text-white">
          MVM Networks
        </Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          className="lg:hidden"
        >
          <Image
            src={open ? '/close.png' : '/menu.svg'}
            alt=""
            width={28}
            height={28}
            priority
            unoptimized
            className="filter invert"
          />
        </button>
        {/* горизонтальное меню */}
        <nav className="hidden lg:flex gap-8">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="underline text-sky-400"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      {/* overlay меню */}
      <div
        className={`
          fixed inset-0 z-40 flex flex-col items-center justify-center gap-8
          bg-black/50 text-3xl lg:hidden
          transition-transform duration-300 ease-out
          ${open ? 'translate-y-0' : '-translate-y-full'}
          backdrop-blur
        `}
      >
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="underline text-sky-400"
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </>
  )
}
