import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 })
    const admin = getAdminSupabase()
    const { data: auth, error: authError } = await admin.auth.getUser(token)
    if (authError || !auth.user) return NextResponse.json({ error: 'Your session is not valid.' }, { status: 401 })
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) return NextResponse.json({ error: 'Upload a PDF, JPEG, or PNG smaller than 5 MB.' }, { status: 400 })
    const { data: clinician } = await admin.from('clinicians').select('id').eq('user_id', auth.user.id).single()
    if (!clinician) return NextResponse.json({ error: 'Clinician application not found.' }, { status: 404 })
    const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await admin.storage.from('verification-evidence').upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError
    const { error: updateError } = await admin.from('verification_requests').update({ evidence_path: path }).eq('clinician_id', clinician.id)
    if (updateError) throw updateError
    return NextResponse.json({ path })
  } catch (error) {
    console.error('Verification evidence upload failed:', error)
    return NextResponse.json({ error: 'We could not upload your evidence. Please try again.' }, { status: 500 })
  }
}
