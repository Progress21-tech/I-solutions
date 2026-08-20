import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { analyseMedicalImage } from '@/lib/ai/imaging'

const RECORD_TYPES = new Set(['diagnosis', 'lab_result', 'prescription', 'note', 'imaging'])
const FILE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const MAX_FILE_BYTES = 10 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 })
    const admin = getAdminSupabase()
    const { data: auth, error: authError } = await admin.auth.getUser(token)
    if (authError || !auth.user) return NextResponse.json({ error: 'Your session is not valid.' }, { status: 401 })
    const form = await request.formData()
    const healthId = String(form.get('patient_health_id') || '').trim().toUpperCase()
    const recordType = String(form.get('record_type') || '')
    const summary = String(form.get('summary') || '').trim()
    const details = String(form.get('details') || '').trim()
    const file = form.get('file')
    if (!healthId || !RECORD_TYPES.has(recordType) || !summary || summary.length > 500) return NextResponse.json({ error: 'Provide a valid patient, record type, and summary (up to 500 characters).' }, { status: 400 })
    if (file instanceof File && (!FILE_TYPES.has(file.type) || file.size > MAX_FILE_BYTES)) return NextResponse.json({ error: 'Attachments must be PDF, JPEG, or PNG and smaller than 10 MB.' }, { status: 400 })
    if (recordType === 'imaging' && (!(file instanceof File) || !file.type.startsWith('image/'))) return NextResponse.json({ error: 'Imaging analysis requires a JPEG or PNG image.' }, { status: 400 })
    const { data: clinician } = await admin.from('clinicians').select('id, verification_status').eq('user_id', auth.user.id).single()
    if (!clinician || clinician.verification_status !== 'verified') return NextResponse.json({ error: 'Only verified clinicians can upload patient records.' }, { status: 403 })
    const { data: patient } = await admin.from('patients').select('id').eq('health_id', healthId).single()
    if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 })
    const { data: grant } = await admin.from('access_grants').select('id').eq('patient_id', patient.id).eq('clinician_id', clinician.id).eq('status', 'active').gt('expires_at', new Date().toISOString()).maybeSingle()
    if (!grant) return NextResponse.json({ error: 'An active patient consent grant is required to upload this record.' }, { status: 403 })
    let attachmentPath: string | null = null
    if (file instanceof File) {
      const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
      attachmentPath = `${patient.id}/${clinician.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await admin.storage.from('medical-records').upload(attachmentPath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError
    }
    const { data: record, error: recordError } = await admin.from('records').insert({ patient_id: patient.id, clinician_id: clinician.id, record_type: recordType, summary, details: { narrative: details || null, attachment_name: file instanceof File ? file.name : null, attachment_mime: file instanceof File ? file.type : null }, attachment_path: attachmentPath }).select('id').single()
    if (recordError) throw recordError
    await admin.from('access_logs').insert({ patient_id: patient.id, clinician_id: clinician.id, action: 'uploaded_record', access_grant_id: grant.id, metadata: { record_id: record.id, record_type: recordType } })
    let imagingStatus: 'not_requested' | 'complete' | 'failed' | 'pending' = 'not_requested'
    if (recordType === 'imaging' && attachmentPath && file instanceof File) {
      const { data: imaging, error: imagingError } = await admin.from('imaging_analyses').insert({ patient_id: patient.id, clinician_id: clinician.id, file_path: attachmentPath, status: 'pending' }).select('id').single()
      if (imagingError) throw imagingError
      try {
        const output = await analyseMedicalImage(file)
        const { error: analysisError } = await admin.from('imaging_analyses').update({ status: 'complete', ai_output: output }).eq('id', imaging.id)
        if (analysisError) throw analysisError
        imagingStatus = 'complete'
      } catch (analysisError) {
        await admin.from('imaging_analyses').update({ status: 'failed', ai_output: { error: analysisError instanceof Error ? analysisError.message : 'Analysis unavailable', disclaimer: 'The image was stored securely, but AI analysis could not be completed. Please review it clinically.' } }).eq('id', imaging.id)
        imagingStatus = 'failed'
      }
    }
    return NextResponse.json({ recordId: record.id, imagingStatus })
  } catch (error) {
    console.error('Record upload failed:', error)
    return NextResponse.json({ error: 'We could not securely save this record. Please try again.' }, { status: 500 })
  }
}
