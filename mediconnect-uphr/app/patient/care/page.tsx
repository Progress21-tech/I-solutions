'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type ProviderType = 'doctor' | 'hospital' | 'lab' | 'pharmacy'
type Provider = { id: string; provider_type: ProviderType; display_name: string; specialty: string | null; address: string; latitude: number; longitude: number }
type PatientLocation = { latitude: number | null; longitude: number | null; location_label: string | null }
const categories: { value: ProviderType | 'all'; label: string }[] = [{ value: 'all', label: 'All care' }, { value: 'doctor', label: 'Doctors' }, { value: 'hospital', label: 'Hospitals' }, { value: 'lab', label: 'Labs' }, { value: 'pharmacy', label: 'Pharmacies' }]

function distanceKm(a: PatientLocation, b: Provider) {
  if (a.latitude == null || a.longitude == null) return null
  const rad = (value: number) => value * Math.PI / 180
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export default function CareMarketplace() {
  const router = useRouter(), search = useSearchParams()
  const [providers, setProviders] = useState<Provider[]>([])
  const [location, setLocation] = useState<PatientLocation>({ latitude: null, longitude: null, location_label: null })
  const requestedType = search.get('type')
  const [type, setType] = useState<ProviderType | 'all'>(categories.some(category => category.value === requestedType) ? requestedType as ProviderType | 'all' : 'all')
  const [specialty, setSpecialty] = useState(search.get('specialty') || '')
  const [loading, setLoading] = useState(true), [error, setError] = useState('')

  useEffect(() => { void load() }, [])
  async function load() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { router.replace('/login'); return }
    const [{ data: patient, error: patientError }, { data: providerData, error: providerError }] = await Promise.all([
      supabase.from('patients').select('latitude, longitude, location_label').eq('user_id', auth.user.id).single(),
      supabase.from('providers').select('id, provider_type, display_name, specialty, address, latitude, longitude').eq('is_listed', true),
    ])
    if (patientError || !patient) setError('We could not load your saved location. You can still browse all listed care providers.')
    else setLocation(patient)
    if (providerError) setError('Care providers are temporarily unavailable. Please try again.')
    else setProviders((providerData || []) as Provider[])
    setLoading(false)
  }
  const results = useMemo(() => providers.filter(provider => type === 'all' || provider.provider_type === type).filter(provider => !specialty.trim() || `${provider.display_name} ${provider.specialty || ''}`.toLowerCase().includes(specialty.toLowerCase())).map(provider => ({ provider, distance: distanceKm(location, provider) })).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)), [providers, type, specialty, location])

  return <main className="min-h-screen bg-slate-50"><header className="border-b border-slate-200 bg-white px-6 py-4"><button onClick={() => router.back()} className="font-semibold text-blue-800 underline">← Back</button><h1 className="mt-2 text-xl font-bold text-slate-950">Find care</h1><p className="text-sm text-slate-700">Onboarded, listed providers near your saved location.</p></header><section className="mx-auto max-w-3xl p-6"><div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-950"><p className="font-semibold">Location: {location.location_label || 'No saved location'}</p><p className="mt-1">{location.latitude == null ? 'Results are not distance-ranked. Add a location during profile setup to see nearby care first.' : 'Results are ordered by approximate distance.'}</p></div>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<div className="mt-6 flex flex-wrap gap-2">{categories.map(category => <button key={category.value} onClick={() => setType(category.value)} className={`rounded-full px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-700 ${type === category.value ? 'bg-blue-700 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100'}`}>{category.label}</button>)}</div><label className="mt-5 block text-sm font-semibold text-slate-900" htmlFor="specialty">Specialty or provider name</label><input id="specialty" value={specialty} onChange={event => setSpecialty(event.target.value)} placeholder="e.g. cardiology" className="mt-2 w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-950 placeholder:text-slate-600 focus:border-blue-700 focus:outline-none" />{loading ? <p className="mt-8 text-slate-700">Loading care options…</p> : <div className="mt-6 space-y-3">{results.length ? results.map(({ provider, distance }) => <article key={provider.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-800">{provider.provider_type}</p><h2 className="mt-1 text-lg font-bold text-slate-950">{provider.display_name}</h2><p className="mt-1 text-sm text-slate-700">{provider.specialty || 'General care'} · {provider.address}</p></div><p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">{distance == null ? 'Distance unavailable' : `${distance.toFixed(1)} km away`}</p></div><button onClick={() => window.alert('Booking and delivery requests are not configured yet. Please contact this provider directly using the details they have supplied.')} className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Request care</button></article>) : <div className="rounded-2xl bg-white p-6 text-sm text-slate-700 shadow-sm">No listed providers match this search yet. Try another category or check back soon.</div>}</div>}</section></main>
}
