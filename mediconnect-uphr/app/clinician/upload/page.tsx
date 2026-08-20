'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const recordTypes = [{ value: 'diagnosis', label: 'Diagnosis' }, { value: 'lab_result', label: 'Lab result' }, { value: 'prescription', label: 'Prescription' }, { value: 'note', label: 'Clinical note' }, { value: 'imaging', label: 'Imaging' }]

function UploadRecord() {
  const router = useRouter(), patientHealthId = useSearchParams().get('patient_id')?.trim().toUpperCase()
  const [patientName, setPatientName] = useState(''), [recordType, setRecordType] = useState('diagnosis'), [summary, setSummary] = useState(''), [details, setDetails] = useState(''), [file, setFile] = useState<File | null>(null), [loading, setLoading] = useState(true), [submitting, setSubmitting] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')

  useEffect(() => { void load() }, [])
  async function load() {
    if (!patientHealthId) { setError('A patient Health ID is required.'); setLoading(false); return }
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { router.replace('/login'); return }
    const { data, error: accessError } = await supabase.rpc('get_granted_patient_record', { p_health_id: patientHealthId })
    if (accessError) setError(accessError.message)
    else setPatientName((data as { patient?: { full_name?: string } })?.patient?.full_name || 'Patient')
    setLoading(false)
  }
  const submit = async () => {
    if (!patientHealthId || !summary.trim()) return
    if (recordType === 'imaging' && !file) { setError('Select a JPEG or PNG image for imaging analysis.'); return }
    setSubmitting(true); setError(''); setMessage('')
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) { setError('Please sign in again.'); setSubmitting(false); return }
    const form = new FormData(); form.append('patient_health_id', patientHealthId); form.append('record_type', recordType); form.append('summary', summary.trim()); form.append('details', details.trim()); if (file) form.append('file', file)
    try {
      const response = await fetch('/api/records', { method: 'POST', headers: { Authorization: `Bearer ${session.session.access_token}` }, body: form })
      const result = await response.json()
      if (!response.ok) { setError(result.error || 'Unable to save this record.'); return }
      setMessage(result.imagingStatus === 'complete' ? 'Record saved. AI imaging support is ready for clinician review.' : result.imagingStatus === 'failed' ? 'Record saved securely. AI imaging analysis is unavailable; please review the image clinically.' : 'Record saved securely.')
      setSummary(''); setDetails(''); setFile(null)
    } catch { setError('Unable to reach the secure record service. Please try again.') } finally { setSubmitting(false) }
  }
  if (loading) return <main className="min-h-screen grid place-items-center bg-slate-50 text-slate-700">Checking secure record access…</main>
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white px-6 py-4"><button onClick={() => router.back()} className="font-semibold text-blue-800 underline">← Back</button></header><section className="mx-auto max-w-2xl p-6"><h1 className="text-2xl font-bold text-slate-950">Add medical record</h1><p className="mt-1 text-sm text-slate-700">For {patientName}. Saving a record requires active patient consent.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}{message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}<div className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-sm"><fieldset><legend className="text-sm font-semibold text-slate-900">Record type</legend><div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">{recordTypes.map(type => <button type="button" key={type.value} onClick={() => setRecordType(type.value)} className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold ${recordType === type.value ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-slate-300 text-slate-800 hover:bg-slate-50'}`}>{type.label}</button>)}</div></fieldset><label className="block text-sm font-semibold text-slate-900">Summary<input value={summary} onChange={event => setSummary(event.target.value)} maxLength={500} className="mt-2 w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-950 focus:border-blue-700 focus:outline-none" placeholder="Brief clinical summary" /></label><label className="block text-sm font-semibold text-slate-900">Details <span className="font-normal text-slate-600">(optional)</span><textarea value={details} onChange={event => setDetails(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-950 focus:border-blue-700 focus:outline-none" placeholder="Clinical details, observations, or follow-up" /></label><label className="block text-sm font-semibold text-slate-900">Attachment {recordType === 'imaging' && <span className="text-red-700">(required: JPEG or PNG)</span>}<input type="file" accept={recordType === 'imaging' ? 'image/jpeg,image/png' : 'application/pdf,image/jpeg,image/png'} onChange={event => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-slate-800" /><span className="mt-1 block text-xs font-normal text-slate-600">Private upload. PDF, JPEG, or PNG only; maximum 10 MB.</span></label><button disabled={submitting || !summary.trim()} onClick={() => void submit()} className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{submitting ? 'Saving securely…' : recordType === 'imaging' ? 'Save and analyse image' : 'Save record'}</button></div></section></main>
}

export default function Page() { return <Suspense fallback={<main className="min-h-screen grid place-items-center">Loading…</main>}><UploadRecord /></Suspense> }
