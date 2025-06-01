//src\app\page.tsx

'use client'
import React, { useState, useEffect, useMemo } from 'react'

function secondsToHMS(totalSeconds: number) {
  totalSeconds = Math.round(totalSeconds);
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`
  }
  return `${minutes} мин`
}

export default function HomePage() {
  // Текущий месяц
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const firstDay = `${yyyy}-${mm}-01`
  const lastDay = new Date(yyyy, now.getMonth() + 1, 0)
  const lastDayStr = `${yyyy}-${mm}-${String(lastDay.getDate()).padStart(2, '0')}`

  const [dateFrom, setDateFrom] = useState<string>(firstDay)
  const [dateTo, setDateTo] = useState<string>(lastDayStr)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Получить данные (при изменении дат или загрузке страницы)
  const fetchData = async (dateFromValue: string, dateToValue: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || ""}/analytics/overdue?date_from=${dateFromValue}&date_to=${dateToValue}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setData(json)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Неизвестная ошибка')
      }
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  // Считаем при первом рендере
  useEffect(() => {
    fetchData(dateFrom, dateTo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Считаем если пользователь поменял дату и убрал фокус
  const handleDateFromBlur = () => {
    fetchData(dateFrom, dateTo)
  }
  const handleDateToBlur = () => {
    fetchData(dateFrom, dateTo)
  }

  // Считаем сумму по исполнителям
  const summaryByExecutors = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    const total: { [surname: string]: number } = {}
    data.forEach((task: any) => {
      (task.executors || []).forEach((exec: any) => {
        if (!exec.surname) return
        if (!total[exec.surname]) total[exec.surname] = 0
        total[exec.surname] += exec.overdue_assigned_seconds
      })
    })
    // Сортируем по убыванию времени
    return Object.entries(total)
      .sort((a, b) => b[1] - a[1])
      .map(([surname, seconds]) => ({ surname, seconds }))
  }, [data])

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-7 text-center text-blue-800">Просроченные задачи</h1>
      <form className="flex gap-4 items-end mb-6 justify-center" onSubmit={e => e.preventDefault()}>
        <div>
          <label className="block text-sm mb-1">С</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            onBlur={handleDateFromBlur}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">По</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            onBlur={handleDateToBlur}
            className="border rounded px-2 py-1"
          />
        </div>
      </form>

      {loading && <div>Загрузка...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {/* Сводка по исполнителям */}
      {summaryByExecutors.length > 0 && (
        <div className="mb-8 bg-blue-50 border-l-4 border-blue-400 rounded p-4 max-w-lg mx-auto">
          <div className="font-bold mb-2 text-blue-800">Суммарно:</div>
          <ul>
            {summaryByExecutors.map(({ surname, seconds }) => (
              <li key={surname} className="mb-1">
                <span className="font-medium">{surname}:</span>{" "}
                <span className="text-red-600 font-semibold">{secondsToHMS(seconds)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && Array.isArray(data) && data.length === 0 && (
        <div className="text-gray-500">Нет просроченных задач за выбранный период</div>
      )}
      {data && Array.isArray(data) && data.length > 0 && (
        <div className="flex flex-col gap-6">
          {data.map((task: any) => (
            <div
              key={task.task_id}
              className="bg-white rounded-2xl shadow-md p-4 border-2 border-blue-100"
            >
              <div className="font-bold text-blue-700 text-lg mb-1">
                Задача #{task.task_id}&nbsp;
                <span className="text-red-600 font-semibold">
                  {secondsToHMS(task.total_overdue_seconds)}
                </span>
              </div>
              <div className="mb-3 text-gray-700 italic">{task.address_raw}</div>
              {task.executors.length > 0 ? (
                <div>
                  <div className="font-semibold mb-1">Назначены:</div>
                  <ul className="list-disc ml-6">
                    {task.executors.map((exec: any) => (
                      <li key={exec.exec_id} className="mb-1">
                        <span className="font-medium">{exec.surname || 'Без имени'}</span>
                        {": "}
                        <span className="text-red-600">{secondsToHMS(exec.overdue_assigned_seconds)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-gray-500">Нет назначения</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
