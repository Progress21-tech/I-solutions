'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type VerificationStatus = 'pending' | 'verified' | 'rejected'

export default function ClinicianPendingPage() {
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus>('pending')
  const [reviewerNote, setReviewerNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

  useEffect(() => {
    let active = true

    const loadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: clinician, error: clinicianError } = await supabase
        .from('clinicians')
        .select('id, verification_status')
        .eq('user_id', user.id)
        .single()

      if (clinicianError || !clinician) {
        if (active) setError('We could not find your clinician application. Please complete onboarding again.')
        return
      }

      const { data: request } = await supabase
        .from('verification_requests')
        .select('status, reviewer_note')
        .eq('clinician_id', clinician.id)
        .maybeSingle()

      if (!active) return
      setStatus((request?.status || clinician.verification_status) as VerificationStatus)
      setReviewerNote(request?.reviewer_note || '')
      setLoading(false)
    }

    void loadStatus()
    return () => { active = false }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const uploadEvidence = async (file: File | undefined) => {
    if (!file) return
    setUploading(true); setUploadMessage(''); setError('')
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) { setError('Please sign in again before uploading evidence.'); setUploading(false); return }
    const form = new FormData(); form.append('file', file)
    const response = await fetch('/api/verification/evidence', { method: 'POST', headers: { Authorization: `Bearer ${session.session.access_token}` }, body: form })
    const result = await response.json()
    if (!response.ok) setError(result.error || 'We could not upload your evidence.')
    else setUploadMessage('Evidence uploaded securely. Our reviewers can now see it.')
    setUploading(false)
  }

  if (loading && !error) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm text-slate-700">Checking your verification status…</p></main>

  const isVerified = status === 'verified'
  const isRejected = status === 'rejected'
  const heading = isVerified ? 'You are verified' : isRejected ? 'Verification needs an update' : 'Verification in progress'
  const message = isVerified
    ? 'Your licence has been verified. You can now access the clinician dashboard and patient records when a patient grants access.'
    : isRejected
      ? 'We could not verify the details submitted with your application. Review the note below, then resubmit your clinician details.'
      : 'Your licence and credentials are under review. Patient record access remains unavailable until verification is complete.'

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-md">
        <div className="mb-4 text-5xl" aria-hidden="true">{isVerified ? '✓' : isRejected ? '!' : '◷'}</div>
        <h1 className="mb-2 text-2xl font-bold text-slate-950">{heading}</h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-700">{error || message}</p>

        {isRejected && reviewerNote && <p className="mb-6 rounded-xl bg-red-50 p-4 text-left text-sm text-red-800"><span className="font-semibold">Reviewer note: </span>{reviewerNote}</p>}

        {!isVerified && !isRejected && <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm text-blue-900"><p className="mb-1 font-semibold">What happens next?</p><ul className="list-inside list-disc space-y-1"><li>We review your licence and credentials.</li><li>You will see the decision here when it is complete.</li><li>Patient-record access stays locked until approval.</li></ul></div>}

        {!isVerified && <div className="mb-6 rounded-xl border border-slate-200 p-4 text-left"><p className="text-sm font-semibold text-slate-900">Supporting evidence (optional)</p><p className="mt-1 text-xs leading-5 text-slate-700">Upload a licence document or clear photo. Accepted: PDF, JPEG, or PNG, up to 5 MB. It is private and only available to authorised reviewers.</p><label className="mt-3 inline-block cursor-pointer rounded-lg border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">{uploading ? 'Uploading…' : 'Upload evidence'}<input type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" disabled={uploading} onChange={(event) => void uploadEvidence(event.target.files?.[0])} /></label>{uploadMessage && <p role="status" className="mt-2 text-sm text-emerald-800">{uploadMessage}</p>}</div>}

        {isVerified ? (
          <button type="button" onClick={() => router.push('/clinician/dashboard')} className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800">Open clinician dashboard</button>
        ) : isRejected || error ? (
          <button type="button" onClick={() => router.push('/register/clinician')} className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800">Resubmit clinician details</button>
        ) : null}

        <button type="button" onClick={handleSignOut} className="mt-4 w-full rounded-xl border-2 border-slate-300 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50">Sign out</button>
      </section>
    </main>
  )
}
