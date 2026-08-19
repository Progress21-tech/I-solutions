'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['Pharmacy', 'Diagnostic lab', 'Clinic', 'Hospital', 'General business', 'Other']
const STEPS = ['name', 'category', 'registration', 'location'] as const
type Step = typeof STEPS[number]

function BusinessSetupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnPath = searchParams.get('next') === 'clinician' ? '/clinician/pending' : '/patient/dashboard'
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: '',
    registrationNumber: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const current = STEPS[step]
  const canContinue = current !== 'name' ? current !== 'category' || Boolean(form.category) : Boolean(form.name.trim())

  const useLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Location is unavailable in this browser. Please enter your business address below.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((value) => ({
        ...value,
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: value.address || 'Current business location shared',
      })),
      () => setError('We could not access your location. Please enter your business address below.'),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  const save = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in before setting up a business.')

      const { error: businessError } = await supabase.from('businesses').upsert({
        owner_id: user.id,
        name: form.name.trim(),
        category: form.category,
        registration_number: form.registrationNumber.trim() || null,
        address: form.address.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
      }, { onConflict: 'owner_id' })
      if (businessError) throw businessError

      router.push(returnPath)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save business details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const next = () => step === STEPS.length - 1 ? void save() : setStep((value) => value + 1)
  const title: Record<Step, string> = {
    name: 'What is your business called?',
    category: 'What kind of business do you manage?',
    registration: 'Do you have a registration number?',
    location: 'Where does your business operate?',
  }
  const subtitle: Record<Step, string> = {
    name: 'Use the name customers know your business by.',
    category: 'This helps us set up the right tools and, for eligible businesses, marketplace visibility.',
    registration: 'This is optional for now. Some healthcare businesses will need verification before they can appear in care discovery.',
    location: 'A location helps patients find verified pharmacies, labs, clinics, and hospitals. You can add it later.',
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">UDPR</h1>
            <p className="text-sm text-slate-700">Business setup</p>
          </div>
          <span className="text-sm font-medium text-slate-700">{step + 1} / {STEPS.length}</span>
        </header>

        <div className="mb-8 h-2 rounded-full bg-slate-200" aria-hidden="true">
          <div className="h-2 rounded-full bg-blue-700 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <h2 className="text-xl font-semibold text-slate-950">{title[current]}</h2>
        <p className="mb-6 mt-1 text-sm text-slate-700">{subtitle[current]}</p>

        {current === 'name' && (
          <label className="block">
            <span className="sr-only">Business name</span>
            <input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sunrise Pharmacy" className="field" />
          </label>
        )}

        {current === 'category' && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Business category">
            {CATEGORIES.map((category) => (
              <button key={category} type="button" aria-pressed={form.category === category} onClick={() => setForm({ ...form, category })} className={`choice text-left ${form.category === category ? 'choice-selected' : ''}`}>
                {category}
              </button>
            ))}
          </div>
        )}

        {current === 'registration' && (
          <label className="block">
            <span className="sr-only">Business registration number</span>
            <input value={form.registrationNumber} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} placeholder="Registration number (optional)" className="field" />
          </label>
        )}

        {current === 'location' && (
          <div className="space-y-3">
            <button type="button" onClick={useLocation} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800">
              Use my current location
            </button>
            <label className="block">
              <span className="sr-only">Business address</span>
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Or enter a town, city, or business address" className="field" />
            </label>
            <p className="text-xs text-slate-700">Optional — you can add or update this later.</p>
          </div>
        )}

        {current === 'registration' && <p className="mt-4 text-xs text-slate-700">Optional — you can provide this during verification instead.</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <footer className="mt-8 flex gap-3">
          {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} disabled={loading} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">Back</button>}
          <button type="button" onClick={next} disabled={!canContinue || loading} className="flex-1 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
            {loading ? 'Saving…' : step === STEPS.length - 1 ? 'Finish business setup' : current === 'registration' ? 'Continue or skip' : 'Continue'}
          </button>
        </footer>

        <button type="button" onClick={() => router.push(returnPath)} disabled={loading} className="mt-4 w-full text-sm font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900">
          Set up my business later
        </button>
      </section>
    </main>
  )
}

// Wrap the component using useSearchParams in a Suspense boundary
export default function BusinessSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BusinessSetupForm />
    </Suspense>
  )
}