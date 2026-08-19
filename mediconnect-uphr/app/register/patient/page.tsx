'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENOTYPES = ['AA', 'AS', 'AC', 'SS', 'SC', 'CC']
const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Sickle cell', 'Heart disease', 'Kidney disease', 'HIV/AIDS', 'Tuberculosis', 'Cancer', 'Epilepsy', 'Other']
const STEPS = ['name', 'birth', 'blood', 'genotype', 'allergies', 'conditions', 'emergency', 'location', 'business'] as const
type Step = typeof STEPS[number]

export default function PatientOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', date_of_birth: '', blood_group: '', genotype: '', allergies: '', chronic_conditions: [] as string[], emergency_contact_name: '', emergency_contact_phone: '', location_label: '', latitude: null as number | null, longitude: null as number | null, is_business_owner: false })
  const current = STEPS[step]
  const optional = !['name', 'birth', 'business'].includes(current)

  const canContinue = () => {
    if (current === 'name') return Boolean(form.full_name.trim())
    if (current === 'birth') return Boolean(form.date_of_birth)
    return true
  }
  const toggleCondition = (condition: string) => setForm((value) => ({ ...value, chronic_conditions: value.chronic_conditions.includes(condition) ? value.chronic_conditions.filter((item) => item !== condition) : [...value.chronic_conditions, condition] }))
  const useLocation = () => {
    setError('')
    if (!navigator.geolocation) { setError('Location is unavailable in this browser. Please enter your town or city below.'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((value) => ({ ...value, latitude: coords.latitude, longitude: coords.longitude, location_label: value.location_label || 'Current location shared' })),
      () => setError('We could not access your location. Please enter your town or city below.'),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }
  const save = async () => {
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in before completing onboarding.')
      const { error: patientError } = await supabase.from('patients').upsert({ user_id: user.id, full_name: form.full_name.trim(), date_of_birth: form.date_of_birth, blood_group: form.blood_group || null, genotype: form.genotype || null, allergies: form.allergies.trim() || null, chronic_conditions: form.chronic_conditions, emergency_contact_name: form.emergency_contact_name.trim() || null, emergency_contact_phone: form.emergency_contact_phone.trim() || null, location_label: form.location_label.trim() || null, latitude: form.latitude, longitude: form.longitude })
      if (patientError) throw patientError
      router.push(form.is_business_owner ? '/register/business' : '/patient/dashboard')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save your profile. Please try again.') }
    finally { setLoading(false) }
  }
  const next = () => step === STEPS.length - 1 ? void save() : setStep((value) => value + 1)
  const title: Record<Step, string> = { name: 'What is your name?', birth: 'What is your date of birth?', blood: 'What is your blood group?', genotype: 'What is your genotype?', allergies: 'Do you have any known allergies?', conditions: 'Do you have a long-term health condition?', emergency: 'Who should we contact in an emergency?', location: 'Where should we look for care near you?', business: 'Do you also manage a business?' }
  const subtitle: Record<Step, string> = { name: 'This appears on your health record.', birth: 'This helps clinicians understand age-related risks.', blood: 'This can be important in an emergency.', genotype: 'You may skip this if you do not know.', allergies: 'Include medicines, foods, or other triggers. You can update this later.', conditions: 'Select any that apply. You can skip and update later.', emergency: 'Optional, but helpful if you ever need urgent care.', location: 'We use this only to show nearby doctors, hospitals, labs, and pharmacies.', business: 'Business access is an add-on to your patient account.' }

  return <main className="min-h-screen bg-slate-50 px-4 py-10"><section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-sm sm:p-8"><header className="mb-8 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-blue-700">UDPR</h1><p className="text-sm text-slate-700">Patient onboarding</p></div><span className="text-sm font-medium text-slate-700">{step + 1} / {STEPS.length}</span></header><div className="mb-8 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-blue-700 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div><h2 className="text-xl font-semibold text-slate-950">{title[current]}</h2><p className="mb-6 mt-1 text-sm text-slate-700">{subtitle[current]}</p>
    {current === 'name' && <input autoFocus value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="e.g. Amara Johnson" className="field" />}
    {current === 'birth' && <input type="date" value={form.date_of_birth} max={new Date().toISOString().split('T')[0]} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} className="field" />}
    {current === 'blood' && <div className="grid grid-cols-4 gap-2">{BLOOD_GROUPS.map((group) => <button key={group} onClick={() => setForm({ ...form, blood_group: group })} className={`choice ${form.blood_group === group ? 'choice-selected' : ''}`}>{group}</button>)}<button onClick={() => setForm({ ...form, blood_group: '' })} className="choice col-span-4">I do not know</button></div>}
    {current === 'genotype' && <div className="grid grid-cols-3 gap-2">{GENOTYPES.map((genotype) => <button key={genotype} onClick={() => setForm({ ...form, genotype })} className={`choice ${form.genotype === genotype ? 'choice-selected' : ''}`}>{genotype}</button>)}<button onClick={() => setForm({ ...form, genotype: '' })} className="choice col-span-3">I do not know</button></div>}
    {current === 'allergies' && <textarea value={form.allergies} onChange={(event) => setForm({ ...form, allergies: event.target.value })} placeholder="e.g. Penicillin, latex, peanuts" className="field min-h-28" />}
    {current === 'conditions' && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{CONDITIONS.map((condition) => <button key={condition} onClick={() => toggleCondition(condition)} className={`choice text-left ${form.chronic_conditions.includes(condition) ? 'choice-selected' : ''}`}>{condition}</button>)}</div>}
    {current === 'emergency' && <div className="space-y-3"><input value={form.emergency_contact_name} onChange={(event) => setForm({ ...form, emergency_contact_name: event.target.value })} placeholder="Contact name" className="field" /><input type="tel" value={form.emergency_contact_phone} onChange={(event) => setForm({ ...form, emergency_contact_phone: event.target.value })} placeholder="Phone number" className="field" /></div>}
    {current === 'location' && <div className="space-y-3"><button onClick={useLocation} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800">Use my current location</button><input value={form.location_label} onChange={(event) => setForm({ ...form, location_label: event.target.value })} placeholder="Or enter a town, city, or address" className="field" /></div>}
    {current === 'business' && <div className="grid grid-cols-2 gap-3"><button onClick={() => setForm({ ...form, is_business_owner: false })} className={`choice ${!form.is_business_owner ? 'choice-selected' : ''}`}>No, continue as a patient</button><button onClick={() => setForm({ ...form, is_business_owner: true })} className={`choice ${form.is_business_owner ? 'choice-selected' : ''}`}>Yes, set up my business</button></div>}
    {optional && <p className="mt-4 text-xs text-slate-700">Optional — you can complete this later.</p>}{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <footer className="mt-8 flex gap-3">{step > 0 && <button onClick={() => setStep((value) => value - 1)} disabled={loading} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">Back</button>}<button onClick={next} disabled={!canContinue() || loading} className="flex-1 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{loading ? 'Saving…' : step === STEPS.length - 1 ? 'Finish onboarding' : optional ? 'Continue or skip' : 'Continue'}</button></footer>
  </section></main>
}
