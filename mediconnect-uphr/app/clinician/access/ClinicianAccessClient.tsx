'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type AccessState = 'loading' | 'pending' | 'granted' | 'error'
type RecordItem = { id: string; record_type: string; summary: string; created_at: string }
type RecordPayload = { patient: { full_name: string; health_id: string; blood_group: string | null; allergies: string | null; chronic_conditions: string[] }; records: RecordItem[]; expires_at: string }

export default function ClinicianAccessClient() {
  const router = useRouter()
  const patientId = useSearchParams().get('patient_id')?.trim().toUpperCase()
  const [state, setState] = useState<AccessState>('loading')
  const [payload, setPayload] = useState<RecordPayload | null>(null)
  const [message, setMessage] = useState('')

  const checkAccess = useCallback(async () => {
    if (!patientId) { setState('error'); setMessage('A patient Health ID is required.'); return }
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { router.replace('/login'); return }
    const { data, error } = await supabase.rpc('request_record_access', { p_health_id: patientId, p_purpose: 'clinician_record_access' })
    if (error) { setState('error'); setMessage(error.message); return }
    if (data?.[0]?.status === 'granted') {
      const result = await supabase.rpc('get_granted_patient_record', { p_health_id: patientId })
      if (result.error) { setState('error'); setMessage(result.error.message); return }
      setPayload(result.data as RecordPayload); setState('granted'); return
    }
    setState('pending')
  }, [patientId, router])

  useEffect(() => { checkAccess() }, [checkAccess])
  useEffect(() => {
    if (state !== 'pending' || !patientId) return
    const timer = window.setInterval(async () => {
      const { data } = await supabase.rpc('get_record_access_status', { p_health_id: patientId })
      if (data?.[0]?.status === 'granted') checkAccess()
    }, 8000)
    return () => window.clearInterval(timer)
  }, [state, patientId, checkAccess])

  if (state === 'loading') return <main className="min-h-screen grid place-items-center bg-slate-50 text-slate-700">Checking secure record access…</main>
  if (state === 'pending') return <Gate title="Consent requested" text="The patient must approve this request before any of their health information is shown. This page will update automatically." action="Check again" onAction={checkAccess} onBack={() => router.push('/clinician/dashboard')} />
  if (state === 'error') return <Gate title="Unable to open record" text={message || 'Please return to the dashboard and try again.'} action="Back to dashboard" onAction={() => router.push('/clinician/dashboard')} />

  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white px-6 py-4"><button onClick={() => router.push('/clinician/dashboard')} className="font-semibold text-blue-800 underline">← Dashboard</button></header><section className="mx-auto max-w-3xl p-6"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Access is active until {new Date(payload!.expires_at).toLocaleString()}. This record view has been logged for the patient.</div><div className="mt-5 rounded-2xl bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold text-slate-900">{payload!.patient.full_name}</h1><p className="mt-1 text-sm text-slate-700">Health ID: {payload!.patient.health_id} · Blood group: {payload!.patient.blood_group || 'Not recorded'}</p><p className="mt-3 text-sm text-slate-700">Allergies: {payload!.patient.allergies || 'None recorded'} · Conditions: {payload!.patient.chronic_conditions?.join(', ') || 'None recorded'}</p></div><div className="mt-5"><button onClick={() => router.push(`/clinician/upload?patient_id=${encodeURIComponent(payload!.patient.health_id)}`)} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Add medical record</button></div><h2 className="mt-7 text-lg font-bold text-slate-900">Medical records</h2><div className="mt-3 space-y-3">{payload!.records.length ? payload!.records.map(record => <article key={record.id} className="rounded-xl bg-white p-5 shadow-sm"><p className="font-semibold capitalize text-slate-900">{record.record_type.replace('_', ' ')}</p><p className="mt-1 text-slate-700">{record.summary}</p><p className="mt-2 text-xs text-slate-600">{new Date(record.created_at).toLocaleString()}</p></article>) : <p className="rounded-xl bg-white p-5 text-sm text-slate-700">No records have been added yet.</p>}</div></section></main>
}

function Gate({ title, text, action, onAction, onBack }: { title: string; text: string; action: string; onAction: () => void; onBack?: () => void }) {
  return <main className="min-h-screen grid place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-2xl bg-white p-7 text-center shadow-sm"><p className="text-4xl" aria-hidden>🔒</p><h1 className="mt-3 text-xl font-bold text-slate-900">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-700">{text}</p><button onClick={onAction} className="mt-6 rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2">{action}</button>{onBack && <button onClick={onBack} className="mt-3 block w-full text-sm font-medium text-blue-800 underline">Back to dashboard</button>}</section></main>
}
