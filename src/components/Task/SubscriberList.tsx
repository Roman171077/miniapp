import React from 'react'
import { Subscriber } from '@/lib/types'
import { toast, ToastContainer, cssTransition } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

/* кастомный transition, который пользуется tailwind-анимациями */
const Fade = cssTransition({
  enter: 'animate-toast-in',
  exit: 'animate-toast-out',
  appendPosition: false,
  collapse: true,
})

interface SubscriberListProps {
  subscribers: Subscriber[]
  onSelect?: (s: Subscriber) => void
}

const SubscriberList: React.FC<SubscriberListProps> = ({ subscribers, onSelect }) => {
  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num).then(() => {
      toast('Номер договора скопирован в буфер обмена', {
        position: 'bottom-center',
        autoClose: 1000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        transition: Fade,
        className: 'rounded px-4 py-2 shadow-none', // только скругление / отступы
        style: {
          // ← перезаписываем фон
          background: 'rgba(31, 37, 46, 0.83)', // gray-800 c прозрачностью 0.8
          color: '#ffffff',
        },
      })
    })
  }

  const addr = (s: Subscriber) =>
    [s.city, s.district, s.street, s.house].filter(Boolean).join(', ')

  return (
    <>
      <div className="space-y-4">
        {subscribers.map((s) => (
          <div
            key={s.contract_number}
            className="p-4 border border-gray-300 rounded-lg shadow-sm cursor-pointer"
            onClick={() => onSelect?.(s)}
          >
            <div className="mb-2">
              <span className="font-semibold">Договор: </span>
              <button
                onClick={() => handleCopy(s.contract_number)}
                className="text-blue-500 hover:underline"
              >
                {s.contract_number}
              </button>
            </div>

            <div className="mb-2">
              <span className="font-semibold">Адрес: </span>
              <span>{addr(s)}</span>
            </div>

            <div className="mb-2">
              <span className="font-semibold">ФИО: </span>
              <span>
                {s.surname} {s.name} {s.patronymic}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Один ToastContainer на всё приложение достаточно; если он уже есть в _app.tsx, этот удалите */}
      <ToastContainer limit={3} newestOnTop />
    </>
  )
}

export default SubscriberList
