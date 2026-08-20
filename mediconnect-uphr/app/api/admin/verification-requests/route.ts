import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { admin } = await requireAdmin(request.headers.get('authorization'))
    const { data, error } = await admin.from('verification_requests').select('id, submitted_license_number, evidence_path, status, reviewer_note, created_at, clinicians(id, full_name, hospital_name, specialty, license_number)').eq('status', 'pending').order('created_at', { ascending: true })
    if (error) throw error
    const requests = await Promise.all((data || []).map(async (item) => {
      if (!item.evidence_path) return { ...item, evidence_url: null }
      const { data: signed } = await admin.storage.from('verification-evidence').createSignedUrl(item.evidence_path, 10 * 60)
      return { ...item, evidence_url: signed?.signedUrl || null }
    }))
    return NextResponse.json({ requests })
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
    const note = body.reviewerNote?.trim().slice(0, 1000) || null
    const { error } = await admin.rpc('review_clinician_verification', { p_request_id: body.requestId, p_decision: body.decision, p_reviewer_note: note })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to record the review.' }, { status: 403 })
  }
}
