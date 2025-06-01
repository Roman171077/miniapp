// src/components/Subscriber/CreateSubscriber.tsx
'use client'

import React, { useState } from 'react'
import { geocodeAddress } from '@/lib/utils/geocode'
import { createSubscriber } from '@/lib/api/tasks'
import type { CreateSubscriberData } from '@/lib/api/tasks'

interface CreateSubscriberProps {
  onClose: () => void
  onCreated: () => void
}

export default function CreateSubscriber({
  onClose,
  onCreated,
}: CreateSubscriberProps) {
  // Состояние формы
  const [form, setForm] = useState({
    contract_number: '',
    surname: '',
    name: '',
    patronymic: '',
    city: '',
    district: '',
    street: '',
    house: '',
  })

  // Результаты геокодирования
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 0,
    longitude: 0,
  })
  const [fullAddress, setFullAddress] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // Нажали «Найти» — сначала валидация, потом геокодим
  const handleFind = async () => {
    // Проверяем, что заполнены: city, house, и хотя бы одно из (district или street)
    if (!form.city.trim() || !form.house.trim()) {
      setErrorMessage('Поля «Город» и «Дом» должны быть заполнены.')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }
    if (!form.district.trim() && !form.street.trim()) {
      setErrorMessage('Нужно заполнить хотя бы одно из полей: «Район» или «Улица».')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }

    setLoading(true)
    try {
      // Собираем адрес для геокодера
      const addressParts = [
        form.city.trim(),
        form.district.trim(),
        form.street.trim(),
        form.house.trim(),
      ]
        .filter(Boolean)
        .join(', ')

      const result = await geocodeAddress(addressParts)
      if (result.fullAddress.trim() === '' && result.latitude === 0 && result.longitude === 0) {
        setErrorMessage('По такому адресу ничего не найдено.')
        setTimeout(() => setErrorMessage(null), 2000)
        setLoading(false)
        return
      }

      // Сохраняем координаты и полный адрес
      setCoords({
        latitude: result.latitude,
        longitude: result.longitude,
      })
      setFullAddress(result.fullAddress)
    } catch (err) {
      console.error('Ошибка при поиске адреса:', err)
      setErrorMessage('Ошибка геокодирования. Попробуйте ещё раз.')
      setTimeout(() => setErrorMessage(null), 2000)
    } finally {
      setLoading(false)
    }
  }

  // Нажали «Создать» — отправляем на сервер
  const handleCreate = async () => {
    // Проверяем: contract_number, city, house
    if (!form.contract_number.trim() || !form.city.trim() || !form.house.trim()) {
      setErrorMessage('Поля «Договор», «Город» и «Дом» должны быть заполнены.')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }
    // Проверяем: хотя бы district или street
    if (!form.district.trim() && !form.street.trim()) {
      setErrorMessage('Нужно заполнить хотя бы одно из полей: «Район» или «Улица».')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }
    // Проверяем, что мы уже получили результаты геокодирования
    if (fullAddress.trim() === '' || (coords.latitude === 0 && coords.longitude === 0)) {
      setErrorMessage('Нажмите «Найти» и дождитесь результатов перед созданием.')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }

    setLoading(true)
    try {
      const payload: CreateSubscriberData = {
        contract_number: form.contract_number.trim(),
        surname: form.surname.trim(),
        name: form.name.trim(),
        patronymic: form.patronymic.trim(),
        city: form.city.trim(),
        district: form.district.trim() || null,
        street: form.street.trim() || null,
        house: form.house.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        yandex_address: fullAddress,
        status: 'active',
      }
      await createSubscriber(payload)
      onCreated()
      onClose()
    } catch (err) {
      console.error('Ошибка создания подписчика:', err)
      setErrorMessage('Ошибка при создании подписчика.')
      setTimeout(() => setErrorMessage(null), 2000)
    } finally {
      setLoading(false)
    }
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
        <h3 className="text-xl font-semibold mb-4">Новый абонент</h3>

        {/* Договор (обязательно) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">
            Договор: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.contract_number}
            onChange={(e) => handleChange('contract_number', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Фамилия (необязательно) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Фамилия:</label>
          <input
            type="text"
            value={form.surname}
            onChange={(e) => handleChange('surname', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Имя (необязательно) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Имя:</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Отчество (необязательно) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Отчество:</label>
          <input
            type="text"
            value={form.patronymic}
            onChange={(e) => handleChange('patronymic', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Город (обязательно) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">
            Город: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Район */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Район:</label>
          <input
            type="text"
            value={form.district}
            onChange={(e) => handleChange('district', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Улица */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Улица:</label>
          <input
            type="text"
            value={form.street}
            onChange={(e) => handleChange('street', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Дом (обязательно) */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">
            Дом: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.house}
            onChange={(e) => handleChange('house', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        {/* Кнопка «Найти» */}
        <div className="mb-4">
          <button
            onClick={handleFind}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            type="button"
          >
            Найти
          </button>
        </div>

        {/* Вывод результатов геокодирования */}
        <div className="mb-3">
          <label className="block mb-1 font-medium">Широта:</label>
          <input
            type="text"
            value={coords.latitude.toString()}
            readOnly
            className="w-full px-2 py-1 border rounded bg-gray-100"
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Долгота:</label>
          <input
            type="text"
            value={coords.longitude.toString()}
            readOnly
            className="w-full px-2 py-1 border rounded bg-gray-100"
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Яндекс адрес:</label>
          <textarea
            value={fullAddress}
            readOnly
            rows={2}
            className="w-full px-2 py-1 border rounded bg-gray-100 resize-none"
          />
        </div>

        {/* Кнопки «Отмена» и «Создать» */}
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
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            type="button"
          >
            {loading ? '...' : 'Создать'}
          </button>
        </div>

        {/* Ошибка валидации */}
        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
      </div>
    </div>
  )
}
