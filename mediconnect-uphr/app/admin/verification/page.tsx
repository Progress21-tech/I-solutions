'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Request = { id: string; submitted_license_number: string; evidence_url: string | null; status: string; reviewer_note: string | null; created_at: string; clinicians: { full_name: string; hospital_name: string; specialty: string; license_number: string } | null }

export default function VerificationReviewPage() {
  const [requests, setRequests] = useState<Request[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [notes, setNotes] = useState<Record<string, string>>({}), [busy, setBusy] = useState<string | null>(null)

  // Added Promise<Record<string, string>> return type here to fix the TypeScript error
  const authHeaders = async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession()
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}
  }

  const load = async () => {
    setLoading(true); setError('')
    const response = await fetch('/api/admin/verification-requests', { headers: await authHeaders() }); const body = await response.json()
    if (!response.ok) setError(body.error || 'Unable to load requests.'); else setRequests(body.requests || [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const review = async (requestId: string, decision: 'verified' | 'rejected') => {
    setBusy(requestId); setError('')
    const response = await fetch('/api/admin/verification-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify({ requestId, decision, reviewerNote: notes[requestId] }) })
    const body = await response.json(); if (!response.ok) setError(body.error || 'Unable to record review.'); else await load()
    setBusy(null)
  }

  return <main className="min-h-screen bg-slate-50 p-6"><section className="mx-auto max-w-4xl"><h1 className="text-2xl font-bold text-slate-950">Licence verification queue</h1><p className="mt-1 text-sm text-slate-700">Only authorised UDPR reviewers can access this queue.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}{loading ? <p className="mt-8 text-slate-700">Loading requests…</p> : <div className="mt-6 space-y-4">{requests.length ? requests.map(request => <article key={request.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-950">{request.clinicians?.full_name || 'Clinician'}</h2><p className="text-sm text-slate-700">{request.clinicians?.specialty} · {request.clinicians?.hospital_name}</p><p className="mt-2 text-sm text-slate-800">Licence: {request.submitted_license_number}</p><p className="text-xs text-slate-600">Submitted {new Date(request.created_at).toLocaleString()}</p></div>{request.evidence_url ? <a className="rounded-lg border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50" href={request.evidence_url} target="_blank" rel="noreferrer">View evidence</a> : <span className="text-sm text-slate-600">No evidence uploaded</span>}</div><label className="mt-4 block text-sm font-semibold text-slate-900">Reviewer note {''}<span className="font-normal text-slate-600">(required for rejection)</span></label><textarea value={notes[request.id] || ''} onChange={(event) => setNotes({ ...notes, [request.id]: event.target.value })} className="mt-2 w-full rounded-xl border-2 border-slate-300 p-3 text-sm text-slate-950 focus:border-blue-700 focus:outline-none" rows={3} /><div className="mt-3 flex gap-3"><button disabled={busy === request.id} onClick={() => void review(request.id, 'verified')} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Verify licence</button><button disabled={busy === request.id} onClick={() => void review(request.id, 'rejected')} className="rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-800 disabled:opacity-50">Reject</button></div></article>) : <p className="rounded-2xl bg-white p-6 text-sm text-slate-700">There are no verification requests to review.</p>}</div>}</section></main>
}