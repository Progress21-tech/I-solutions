'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['Pharmacy', 'Diagnostic lab', 'Clinic', 'Hospital', 'General business', 'Other']

export default function BusinessSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') === 'clinician' ? '/clinician/pending' : '/patient/dashboard'
  const [form, setForm] = useState({ name: '', category: '', registration_number: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const save = async () => {
    if (!form.name.trim() || !form.category) { setError('Enter a business name and category.'); return }
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in before setting up a business.')
      const { error: businessError } = await supabase.from('businesses').upsert({ owner_id: user.id, name: form.name.trim(), category: form.category, registration_number: form.registration_number.trim() || null })
      if (businessError) throw businessError
      router.push(nextPath)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save business details.') }
    finally { setLoading(false) }
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-10"><section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-blue-700">Set up your business</h1><p className="mt-2 text-sm text-slate-700">You can complete verification later. Verified pharmacies and labs can appear in care discovery.</p><div className="mt-6 space-y-4"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Business name" className="field" /><div className="grid grid-cols-2 gap-2">{CATEGORIES.map((category) => <button key={category} onClick={() => setForm({ ...form, category })} className={`choice text-left ${form.category === category ? 'choice-selected' : ''}`}>{category}</button>)}</div><input value={form.registration_number} onChange={(event) => setForm({ ...form, registration_number: event.target.value })} placeholder="Registration number (optional)" className="field" /></div>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="mt-8 flex gap-3"><button onClick={() => router.push(nextPath)} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-800">Skip for now</button><button onClick={() => void save()} disabled={loading} className="flex-1 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Saving…' : 'Save business'}</button></div></section></main>
}
