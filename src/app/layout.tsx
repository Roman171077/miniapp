//src\app\layout.tsx
import './globals.css'
import Script from 'next/script'
import { UserRoleProvider } from '@/context/UserRoleContext'
import AppGuard from '@/components/AppGuard'

export const metadata = { title: 'Next + Tailwind' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Script
          src={`https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_API_KEY}&lang=ru_RU`}
          strategy="beforeInteractive"
        />
        <Script
          src="https://telegram.org/js/telegram-web-app.js?57"
          strategy="beforeInteractive"
        />
        <UserRoleProvider>
          <AppGuard>
            {children}
          </AppGuard>
        </UserRoleProvider>
      </body>
    </html>
  )
}
