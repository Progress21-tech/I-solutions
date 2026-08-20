import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { admin } = await requireAdmin(request.headers.get('authorization'))
    const { data, error } = await admin.from('verification_requests').select('id, submitted_license_number, evidence_path, status, reviewer_note, created_at, clinicians(id, full_name, hospital_name, specialty, license_number)').order('created_at', { ascending: true })
    if (error) throw error
    return NextResponse.json({ requests: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load verification requests.' }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin } = await requireAdmin(request.headers.get('authorization'))
    const body = await request.json() as { requestId?: string; decision?: string; reviewerNote?: string }
    if (!body.requestId || !['verified', 'rejected'].includes(body.decision || '')) return NextResponse.json({ error: 'A request and valid decision are required.' }, { status: 400 })
    if (body.decision === 'rejected' && !body.reviewerNote?.trim()) return NextResponse.json({ error: 'Provide a reviewer note when rejecting an application.' }, { status: 400 })
    const { data: verification, error: verificationError } = await admin.from('verification_requests').select('clinician_id').eq('id', body.requestId).single()
    if (verificationError || !verification) return NextResponse.json({ error: 'Verification request not found.' }, { status: 404 })
    const note = body.reviewerNote?.trim().slice(0, 1000) || null
    const { error: requestError } = await admin.from('verification_requests').update({ status: body.decision, reviewer_note: note, reviewed_at: new Date().toISOString() }).eq('id', body.requestId)
    if (requestError) throw requestError
    const { error: clinicianError } = await admin.from('clinicians').update({ verification_status: body.decision }).eq('id', verification.clinician_id)
    if (clinicianError) throw clinicianError
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to record the review.' }, { status: 403 })
  }
}
