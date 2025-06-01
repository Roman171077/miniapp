// src/components/Task/CreateTask.tsx
'use client'

import React, { useState } from 'react'
import { geocodeAddress } from '@/lib/utils/geocode'
import { localToUtc, localToUtc2359, defaultPlan } from '@/lib/utils/date'
import { createTask } from '@/lib/api/tasks'
import type { Executor, Subscriber } from '@/lib/types'

interface CreateTaskProps {
  executors: Executor[]
  subscribers: Subscriber[] // массив подписчиков
  userId: number
  onClose: () => void
  onCreated: () => void
}

export default function CreateTask({
  executors,
  subscribers,
  userId,
  onClose,
  onCreated,
}: CreateTaskProps) {
  const [task, setTask] = useState({
    contract_number: '',
    address_raw: '',
    _planned_at: defaultPlan(),
    _due_dt: '',
    _service_min: 60,
    movable: true,
    priority: 'B' as 'A' | 'B' | 'C',
    type: 'service' as 'connection' | 'service' | 'incident',
    executorIds: (() => {
      try {
        const s = localStorage.getItem('lastExecutorIds')
        return s ? (JSON.parse(s) as number[]) : []
      } catch {
        return []
      }
    })(),
    notes: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [loading, setLoading] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const handleChange = (field: string, value: any) =>
    setTask((prev) => ({ ...prev, [field]: value }))

  const addExecutor = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    if (!id) return
    setTask((prev) => ({
      ...prev,
      executorIds: [...prev.executorIds, id],
    }))
    e.target.value = ''
  }

  const removeExecutor = (idx: number) =>
    setTask((prev) => ({
      ...prev,
      executorIds: prev.executorIds.filter((_, i) => i !== idx),
    }))

  const handleCreate = async () => {
    if (!task.address_raw.trim() || !task._planned_at) return
    setLoading(true)

    try {
      let lat: number
      let lng: number

      // 1) Если обе координаты уже есть, используем их; иначе – геокодим
      if (task.latitude !== null && task.longitude !== null) {
        lat = task.latitude
        lng = task.longitude
      } else {
        const coords = await geocodeAddress(task.address_raw.trim())
        if (!coords) {
          alert('Адрес не найден геокодером')
          setLoading(false)
          return
        }
        // Сохраняем в стейт, чтобы поля «Широта»/«Долгота» обновились
        handleChange('latitude', coords.latitude)
        handleChange('longitude', coords.longitude)

        lat = coords.latitude
        lng = coords.longitude
      }

      // 2) Собираем dueIso
      const dueLocal = task._due_dt || task._planned_at
      const dueIso = localToUtc2359(dueLocal)!

      // 3) Если contract_number пустая строка => отправляем null
      const contractNumberToSend =
        task.contract_number.trim() !== '' ? task.contract_number.trim() : null

      // 4) Вызываем API, передаём валидные lat/lng и корректное contract_number
      await createTask(
        {
          address_raw:     task.address_raw.trim(),
          service_minutes: task._service_min,
          planned_start:   localToUtc(task._planned_at)!,
          due_datetime:    dueIso,
          movable:         task.movable,
          priority:        task.priority,
          type:            task.type,
          executor_ids:    task.executorIds,
          notes:           task.notes,

          lat: lat,
          lng: lng,

          // Передаём либо реальный контракт, либо null
          contract_number: contractNumberToSend,
        },
        userId
      )

      // 5) Сохраняем последний выбор исполнителей и закрываем модалку
      localStorage.setItem('lastExecutorIds', JSON.stringify(task.executorIds))
      onCreated()
      onClose()
    } catch (err) {
      console.error('Ошибка создания задачи:', err)
    } finally {
      setLoading(false)
    }
  }

  // Ищем подписчика и заполняем адрес + координаты
  const handleFindSubscriber = () => {
    const subscriber = subscribers.find(
      (sub) => sub.contract_number === task.contract_number
    )

    if (!subscriber) {
      setAlertMessage('Не найдено совпадений с контрактом.')
      setTimeout(() => setAlertMessage(null), 1000)
      return
    }

    const { city, district, street, house, latitude, longitude } = subscriber
    const addressParts = [city, district, street, house]
      .filter(Boolean)
      .join(', ')

    setTask((prev) => ({
      ...prev,
      address_raw: addressParts,
      latitude: latitude,
      longitude: longitude,
    }))
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 min-w-[340px] w-full max-w-md overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Новая задача</h3>

        {/* Поле «Начало» */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Начало:</label>
          <input
            type="datetime-local"
            value={task._planned_at}
            onChange={(e) => handleChange('_planned_at', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Поле «Дедлайн» */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Дедлайн:</label>
          <input
            type="datetime-local"
            value={task._due_dt}
            onChange={(e) => handleChange('_due_dt', e.target.value)}
            onFocus={() => {
              if (!task._due_dt) {
                const d = new Date()
                const D = `${d.getFullYear()}-${String(
                  d.getMonth() + 1
                ).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                handleChange('_due_dt', D + 'T23:00')
              }
            }}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Поле «Время (мин)» */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Время (мин):</label>
          <input
            type="number"
            value={task._service_min}
            onChange={(e) =>
              handleChange('_service_min', Number(e.target.value))
            }
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Поле «Приоритет» */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Приоритет:</label>
          <select
            value={task.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        {/* Поле «Тип задачи» */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Тип задачи:</label>
          <select
            value={task.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="connection">Подключение</option>
            <option value="service">Сервис</option>
            <option value="incident">Авария</option>
          </select>
        </div>

        {/* Поле «Договор» + кнопка «Найти» */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Договор:</label>
          <input
            type="text"
            value={task.contract_number}
            onChange={(e) => handleChange('contract_number', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
          <button
            onClick={handleFindSubscriber}
            className="mt-2 px-4 py-2 text-white bg-blue-600 rounded"
          >
            Найти
          </button>
        </div>

        {/* Ошибка, если не найден подписчик */}
        {alertMessage && <p className="text-red-500 text-sm">{alertMessage}</p>}

        {/* Поле «Адрес» (textarea) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Адрес:</label>
          <textarea
            value={task.address_raw}
            onChange={(e) => handleChange('address_raw', e.target.value)}
            rows={2}
            className="w-full px-2 py-1 border rounded resize-none"
            style={{ minHeight: 40 }}
          />
        </div>

        {/* Поле «Широта» (readonly) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Широта:</label>
          <input
            type="text"
            value={task.latitude !== null ? task.latitude : ''}
            className="w-full px-2 py-1 border rounded"
            readOnly
          />
        </div>

        {/* Поле «Долгота» (readonly) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Долгота:</label>
          <input
            type="text"
            value={task.longitude !== null ? task.longitude : ''}
            className="w-full px-2 py-1 border rounded"
            readOnly
          />
        </div>

        {/* Поле «Назначены» */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Назначены:</label>
          <div className="flex gap-2 flex-wrap my-2">
            {task.executorIds.map((id, idx) => {
              const ex = executors.find((e) => e.exec_id === id)
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-zinc-100 px-2 rounded"
                >
                  <span>{ex?.surname}</span>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => removeExecutor(idx)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              )
            })}
            {task.executorIds.length < executors.length && (
              <select
                defaultValue=""
                onChange={addExecutor}
                className="px-2 py-1 border rounded"
              >
                <option value="">— Назначить —</option>
                {executors
                  .filter((e) => !task.executorIds.includes(e.exec_id))
                  .map((e) => (
                    <option key={e.exec_id} value={e.exec_id}>
                      {e.surname}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        {/* Кнопки «Отмена» и «Добавить» */}
        <div className="flex justify-end gap-4 mb-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            type="button"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 rounded bg-sky-500 text-white hover:bg-sky-600"
            type="button"
          >
            {loading ? '...' : 'Добавить'}
          </button>
        </div>

        {/* Поле «Комментарии» */}
        <div>
          <label className="block mb-1 font-medium">Комментарии:</label>
          <textarea
            value={task.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-2 py-1 border rounded min-h-[48px]"
          />
        </div>
      </div>
    </div>
  )
}
