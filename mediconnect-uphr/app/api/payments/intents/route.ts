import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

const PLAN_ENV: Record<string, string> = { basic: 'CLINICIAN_BASIC_PLAN_AMOUNT_KOBO', pro: 'CLINICIAN_PRO_PLAN_AMOUNT_KOBO' }

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 })
    const admin = getAdminSupabase(); const { data: auth } = await admin.auth.getUser(token)
    if (!auth.user) return NextResponse.json({ error: 'Your session is not valid.' }, { status: 401 })
    const { plan, provider = 'interswitch' } = await request.json() as { plan?: string; provider?: string }
    const amount = Number(process.env[PLAN_ENV[plan || '']])
    if (!Number.isSafeInteger(amount) || amount <= 0 || !['interswitch', 'opay'].includes(provider)) return NextResponse.json({ error: 'Payment configuration is unavailable.' }, { status: 503 })
    const { data: clinician } = await admin.from('clinicians').select('id, verification_status').eq('user_id', auth.user.id).single()
    if (!clinician || clinician.verification_status !== 'verified') return NextResponse.json({ error: 'Your clinician account must be verified before subscribing.' }, { status: 403 })
    const reference = `UDPR-${crypto.randomUUID()}`
    const { error } = await admin.from('payment_intents').insert({ owner_id: auth.user.id, provider, purpose: `clinician_subscription_${plan}`, amount_kobo: amount, merchant_reference: reference, metadata: { clinician_id: clinician.id, plan } })
    if (error) throw error
    const checkout = provider === 'interswitch' ? { scriptUrl: process.env.NEXT_PUBLIC_INTERSWITCH_CHECKOUT_SCRIPT_URL, merchantCode: process.env.NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE, payItemId: process.env.NEXT_PUBLIC_INTERSWITCH_PAY_ITEM_ID } : null
    if (provider === 'interswitch' && (!checkout.scriptUrl || !checkout.merchantCode || !checkout.payItemId)) return NextResponse.json({ error: 'Interswitch checkout is not configured.' }, { status: 503 })
    return NextResponse.json({ reference, amountKobo: amount, checkout })
  } catch (error) {
    console.error('Payment intent creation failed:', error)
    return NextResponse.json({ error: 'Unable to create a secure payment request.' }, { status: 500 })
  }
}
