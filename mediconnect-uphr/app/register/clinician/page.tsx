'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SPECIALTIES = ['General practice', 'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry', 'Surgery', 'Internal medicine', 'Endocrinology', 'Dermatology', 'Obstetrics & gynaecology', 'Other']
const STEPS = ['name', 'facility', 'specialty', 'license', 'experience', 'location', 'business'] as const
type Step = typeof STEPS[number]

export default function ClinicianOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', hospital_name: '', specialty: '', license_number: '', years_experience: '', practice_location: '', is_business_owner: false })
  const current = STEPS[step]
  const required: Step[] = ['name', 'facility', 'specialty', 'license', 'location']
  const valueFor = (field: Step) => ({ name: form.full_name, facility: form.hospital_name, specialty: form.specialty, license: form.license_number, experience: form.years_experience, location: form.practice_location, business: 'yes' })[field]
  const canContinue = () => !required.includes(current) || Boolean(valueFor(current)?.trim())
  const submit = async () => {
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in before completing onboarding.')
      const { data: clinician, error: clinicianError } = await supabase.from('clinicians').upsert({ user_id: user.id, full_name: form.full_name.trim(), hospital_name: form.hospital_name.trim(), specialty: form.specialty, license_number: form.license_number.trim(), years_experience: form.years_experience ? Number(form.years_experience) : null, practice_location: form.practice_location.trim(), verification_status: 'pending' }).select('id').single()
      if (clinicianError) throw clinicianError
      const { error: requestError } = await supabase.from('verification_requests').upsert({ clinician_id: clinician.id, submitted_license_number: form.license_number.trim(), status: 'pending' }, { onConflict: 'clinician_id' })
      if (requestError) throw requestError
      router.push(form.is_business_owner ? '/register/business?next=clinician' : '/clinician/pending')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to submit your verification.') }
    finally { setLoading(false) }
  }
  const next = () => step === STEPS.length - 1 ? void submit() : setStep((value) => value + 1)
  const title: Record<Step, string> = { name: 'What is your professional name?', facility: 'Where do you practise?', specialty: 'What is your specialty?', license: 'What is your medical licence number?', experience: 'How many years have you practised?', location: 'Where should patients find you?', business: 'Do you also manage a business?' }
  const subtitle: Record<Step, string> = { name: 'Use the name that appears on your licence.', facility: 'Enter your primary hospital, clinic, or practice.', specialty: 'Choose the closest match for your practice.', license: 'Your account remains restricted until the licence is verified.', experience: 'Optional — this will be displayed after verification.', location: 'This lets patients discover your service in their area.', business: 'Business tools are an optional add-on to your clinician account.' }
  return <main className="min-h-screen bg-slate-50 px-4 py-10"><section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-sm sm:p-8"><header className="mb-8 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-emerald-700">UDPR</h1><p className="text-sm text-slate-700">Clinician onboarding</p></div><span className="text-sm font-medium text-slate-700">{step + 1} / {STEPS.length}</span></header><div className="mb-8 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-emerald-700" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div><h2 className="text-xl font-semibold text-slate-950">{title[current]}</h2><p className="mb-6 mt-1 text-sm text-slate-700">{subtitle[current]}</p>
    {current === 'name' && <input autoFocus value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="e.g. Dr Chidi Okafor" className="field" />}
    {current === 'facility' && <input value={form.hospital_name} onChange={(event) => setForm({ ...form, hospital_name: event.target.value })} placeholder="Hospital, clinic, or practice name" className="field" />}
    {current === 'specialty' && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{SPECIALTIES.map((specialty) => <button key={specialty} onClick={() => setForm({ ...form, specialty })} className={`choice text-left ${form.specialty === specialty ? 'choice-selected' : ''}`}>{specialty}</button>)}</div>}
    {current === 'license' && <input value={form.license_number} onChange={(event) => setForm({ ...form, license_number: event.target.value })} placeholder="e.g. MDCN/R&R/12345" className="field" />}
    {current === 'experience' && <input inputMode="numeric" value={form.years_experience} onChange={(event) => setForm({ ...form, years_experience: event.target.value.replace(/\D/g, '') })} placeholder="Years of experience (optional)" className="field" />}
    {current === 'location' && <input value={form.practice_location} onChange={(event) => setForm({ ...form, practice_location: event.target.value })} placeholder="Town, city, or practice address" className="field" />}
    {current === 'business' && <div className="grid grid-cols-2 gap-3"><button onClick={() => setForm({ ...form, is_business_owner: false })} className={`choice ${!form.is_business_owner ? 'choice-selected' : ''}`}>No, continue</button><button onClick={() => setForm({ ...form, is_business_owner: true })} className={`choice ${form.is_business_owner ? 'choice-selected' : ''}`}>Yes, set up business</button></div>}
    {current === 'experience' && <p className="mt-4 text-xs text-slate-700">Optional — you can add this later.</p>}{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <footer className="mt-8 flex gap-3">{step > 0 && <button onClick={() => setStep((value) => value - 1)} disabled={loading} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800">Back</button>}<button onClick={next} disabled={!canContinue() || loading} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{loading ? 'Submitting…' : step === STEPS.length - 1 ? 'Submit for verification' : 'Continue'}</button></footer>
  </section></main>
}
