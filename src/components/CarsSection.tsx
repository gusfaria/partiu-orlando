'use client'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'
import { uploadCarPhoto, deleteCarPhoto } from '@/lib/photos'
import { isCarFormValid, type CarFormValue } from '@/lib/car-form'
import { CarCard } from './CarCard'
import type { CarWithCreator } from '@/types/database'

const EMPTY: CarFormValue = {
  rental_company: '', location: '', pickup_date: '', dropoff_date: '', brand: '', color: '', seats: '',
}

export function CarsSection() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [cars, setCars] = useState<CarWithCreator[]>([])
  const [form, setForm] = useState<CarFormValue | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from('cars').select('*, profiles(*)').order('created_at')
    setCars((data as CarWithCreator[]) ?? [])
  }

  useEffect(() => { load() }, [])

  function startCreate() {
    setEditingId(null)
    setExistingPhotoPath(null)
    setPhotoFile(null)
    setError('')
    setForm({ ...EMPTY })
  }

  function startEdit(car: CarWithCreator) {
    setEditingId(car.id)
    setExistingPhotoPath(car.photo_path)
    setPhotoFile(null)
    setError('')
    setForm({
      rental_company: car.rental_company,
      location: car.location,
      pickup_date: car.pickup_date,
      dropoff_date: car.dropoff_date,
      brand: car.brand,
      color: car.color,
      seats: String(car.seats),
    })
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoFile(e.target.files?.[0] ?? null)
  }

  async function save() {
    if (!form || !isCarFormValid(form) || !profile) return
    setSaving(true)
    setError('')
    try {
      let photoPath = existingPhotoPath
      if (photoFile) {
        const newPath = await uploadCarPhoto(photoFile)
        if (existingPhotoPath) await deleteCarPhoto(existingPhotoPath)
        photoPath = newPath
      }
      const row = {
        rental_company: form.rental_company,
        location: form.location,
        pickup_date: form.pickup_date,
        dropoff_date: form.dropoff_date,
        brand: form.brand,
        color: form.color,
        seats: Number(form.seats),
        photo_path: photoPath,
      }
      if (editingId) {
        await supabase.from('cars').update(row).eq('id', editingId)
      } else {
        await supabase.from('cars').insert({ ...row, created_by: profile.id })
      }
      setForm(null)
      setEditingId(null)
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch {
      setError(t.profile.invalid_file)
    }
    setSaving(false)
  }

  async function remove(car: CarWithCreator) {
    if (!confirm(t.common.confirm_delete)) return
    if (car.photo_path) await deleteCarPhoto(car.photo_path)
    await supabase.from('cars').delete().eq('id', car.id)
    load()
  }

  function field(key: keyof CarFormValue, label: string, type = 'text') {
    return (
      <div key={key}>
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <input type={type} value={form?.[key] ?? ''}
          onChange={e => setForm(f => ({ ...f!, [key]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>
    )
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t.cars.section_title}</h2>

      {!form && (
        <button onClick={startCreate}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 mb-4">
          + {t.cars.add}
        </button>
      )}

      {form && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 mb-4">
          {field('rental_company', t.cars.rental_company)}
          {field('location', t.cars.location)}
          <div className="grid grid-cols-2 gap-3">
            {field('pickup_date', t.cars.pickup_date, 'date')}
            {field('dropoff_date', t.cars.dropoff_date, 'date')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('brand', t.cars.brand)}
            {field('color', t.cars.color)}
          </div>
          {field('seats', t.cars.seats, 'number')}
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t.cars.photo}</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile}
              className="text-sm text-gray-600" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !isCarFormValid(form)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? t.profile.uploading : t.cars.save}
            </button>
            <button onClick={() => { setForm(null); setEditingId(null) }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              {t.cars.cancel}
            </button>
          </div>
        </div>
      )}

      {cars.length === 0 && !form && (
        <p className="text-gray-400 text-sm">{t.cars.empty}</p>
      )}

      <div className="space-y-3">
        {cars.map(car => (
          <CarCard key={car.id} car={car} onEdit={() => startEdit(car)} onDelete={() => remove(car)} />
        ))}
      </div>
    </div>
  )
}
