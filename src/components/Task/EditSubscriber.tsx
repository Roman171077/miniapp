'use client'

import React, { useState } from 'react'
import { geocodeAddress } from '@/lib/utils/geocode'
import { updateSubscriber } from '@/lib/api/tasks'
import type { Subscriber } from '@/lib/types'

interface EditSubscriberProps {
  subscriber: Subscriber
  onClose: () => void
  onUpdated: () => void
}

export default function EditSubscriber({ subscriber, onClose, onUpdated }: EditSubscriberProps) {
  const [form, setForm] = useState({
    contract_number: subscriber.contract_number,
    surname: subscriber.surname || '',
    name: subscriber.name || '',
    patronymic: subscriber.patronymic || '',
    city: subscriber.city,
    district: subscriber.district || '',
    street: subscriber.street || '',
    house: subscriber.house,
  })

  const [coords, setCoords] = useState({
    latitude: subscriber.latitude,
    longitude: subscriber.longitude,
  })
  const [fullAddress, setFullAddress] = useState<string>(subscriber.yandex_address)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleFind = async () => {
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
      const addr = [form.city.trim(), form.district.trim(), form.street.trim(), form.house.trim()]
        .filter(Boolean)
        .join(', ')
      const result = await geocodeAddress(addr)
      if (result.fullAddress.trim() === '' && result.latitude === 0 && result.longitude === 0) {
        setErrorMessage('По такому адресу ничего не найдено.')
        setTimeout(() => setErrorMessage(null), 2000)
        setLoading(false)
        return
      }
      setCoords({ latitude: result.latitude, longitude: result.longitude })
      setFullAddress(result.fullAddress)
    } catch (err) {
      console.error('Ошибка при поиске адреса:', err)
      setErrorMessage('Ошибка геокодирования. Попробуйте ещё раз.')
      setTimeout(() => setErrorMessage(null), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
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
    if (fullAddress.trim() === '') {
      setErrorMessage('Нажмите «Найти» и дождитесь результатов перед сохранением.')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }

    setLoading(true)
    try {
      await updateSubscriber(subscriber.contract_number, {
        contract_number: form.contract_number,
        surname: form.surname || null,
        name: form.name || null,
        patronymic: form.patronymic || null,
        city: form.city,
        district: form.district || null,
        street: form.street || null,
        house: form.house,
        latitude: coords.latitude,
        longitude: coords.longitude,
        yandex_address: fullAddress,
      })
      onUpdated()
    } catch (err) {
      console.error('Ошибка при обновлении абонента:', err)
      setErrorMessage('Не удалось обновить абонента.')
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
        <h3 className="text-xl font-semibold mb-4">Редактировать абонента</h3>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Договор:</label>
          <input
            type="text"
            value={form.contract_number}
            onChange={(e) => handleChange('contract_number', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Фамилия:</label>
          <input type="text" value={form.surname} onChange={(e) => handleChange('surname', e.target.value)} className="w-full px-2 py-1 border rounded" />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Имя:</label>
          <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-2 py-1 border rounded" />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Отчество:</label>
          <input type="text" value={form.patronymic} onChange={(e) => handleChange('patronymic', e.target.value)} className="w-full px-2 py-1 border rounded" />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Город: <span className="text-red-500">*</span></label>
          <input type="text" value={form.city} onChange={(e) => handleChange('city', e.target.value)} className="w-full px-2 py-1 border rounded" />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Район:</label>
          <input type="text" value={form.district} onChange={(e) => handleChange('district', e.target.value)} className="w-full px-2 py-1 border rounded" />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Улица:</label>
          <input type="text" value={form.street} onChange={(e) => handleChange('street', e.target.value)} className="w-full px-2 py-1 border rounded" />
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Дом: <span className="text-red-500">*</span></label>
          <input type="text" value={form.house} onChange={(e) => handleChange('house', e.target.value)} className="w-full px-2 py-1 border rounded" />
        </div>

        <div className="mb-4">
          <button onClick={handleFind} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" type="button">
            Найти
          </button>
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Широта:</label>
          <input
            type="text"
            value={coords.latitude.toString()}
            onChange={(e) =>
              setCoords({ ...coords, latitude: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-2 py-1 border rounded"
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Долгота:</label>
          <input
            type="text"
            value={coords.longitude.toString()}
            onChange={(e) =>
              setCoords({ ...coords, longitude: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-2 py-1 border rounded"
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Яндекс адрес:</label>
          <textarea
            value={fullAddress}
            onChange={(e) => setFullAddress(e.target.value)}
            rows={2}
            className="w-full px-2 py-1 border rounded resize-none"
          />
        </div>

        <div className="flex justify-end gap-4 mb-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" type="button">
            Отмена
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" type="button">
            {loading ? '...' : 'Сохранить'}
          </button>
        </div>

        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
      </div>
    </div>
  )
}

