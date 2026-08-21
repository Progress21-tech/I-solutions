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

  if (state === 'loading') return <main className="workflow-page grid place-items-center text-slate-700">Checking secure record access…</main>
  if (state === 'pending') return <Gate title="Consent requested" text="The patient must approve this request before any of their health information is shown. This page will update automatically." action="Check again" onAction={checkAccess} onBack={() => router.push('/clinician/dashboard')} />
  if (state === 'error') return <Gate title="Unable to open record" text={message || 'Please return to the dashboard and try again.'} action="Back to dashboard" onAction={() => router.push('/clinician/dashboard')} />

  return <main className="workflow-page"><header className="workflow-header"><div><button onClick={() => router.push('/clinician/dashboard')} className="workflow-back">← Dashboard</button><p className="dashboard-kicker">Secure workspace</p><h1>{payload!.patient.full_name}</h1><p className="dashboard-subtitle">Health ID: {payload!.patient.health_id} · Blood group: {payload!.patient.blood_group || 'Not recorded'}</p></div><button onClick={() => router.push(`/clinician/upload?patient_id=${encodeURIComponent(payload!.patient.health_id)}`)} className="dashboard-primary-action">Add medical record <span>+</span></button></header><div className="workflow-detail"><div className="workflow-copy"><h3>Active consent</h3><p>Access is active until {new Date(payload!.expires_at).toLocaleString()}. This record view has been logged for the patient.</p></div><div className="workflow-copy"><h3>Patient context</h3><p>Allergies: {payload!.patient.allergies || 'None recorded'} · Conditions: {payload!.patient.chronic_conditions?.join(', ') || 'None recorded'}</p></div><div className="workflow-copy"><h3>Medical records</h3><div className="patient-list">{payload!.records.length ? payload!.records.map(record => <article key={record.id} className="patient-row"><span className="workflow-item-icon">□</span><span className="patient-row-main"><strong className="capitalize">{record.record_type.replace('_', ' ')}</strong><small>{record.summary} · {new Date(record.created_at).toLocaleString()}</small></span></article>) : <p className="empty-panel">No records have been added yet.</p>}</div></div></div></main>
}

function Gate({ title, text, action, onAction, onBack }: { title: string; text: string; action: string; onAction: () => void; onBack?: () => void }) {
  return <main className="workflow-page grid place-items-center"><section className="workflow-detail max-w-md text-center"><p className="text-4xl" aria-hidden>🔒</p><h1 className="mt-3 text-xl font-bold text-slate-900">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-700">{text}</p><button onClick={onAction} className="dashboard-primary-action mt-6">{action}</button>{onBack && <button onClick={onBack} className="workflow-back mt-3 block w-full">Back to dashboard</button>}</section></main>
}
