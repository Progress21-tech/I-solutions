import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { verifyOpayWebhook } from '@/lib/payments/webhooks'

type OpayPayload = { amount: string; currency: string; reference: string; refunded: boolean; status: string; timestamp: string; token?: string; transactionId: string }
export async function POST(request: Request) {
  try {
    const event = await request.json() as { payload?: OpayPayload; sha512?: string }
    if (!event.payload || !verifyOpayWebhook(event.payload, event.sha512)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
    if (!['successful', 'success'].includes(event.payload.status.toLowerCase()) || event.payload.currency !== 'NGN' || event.payload.refunded) return NextResponse.json({ ok: true })
    const amountKobo = Math.round(Number(event.payload.amount) * 100)
    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 })
    const admin = getAdminSupabase(); const { error } = await admin.rpc('settle_payment_intent', { p_reference: event.payload.reference, p_provider_reference: event.payload.transactionId, p_provider: 'opay', p_amount_kobo: amountKobo, p_event_id: event.payload.transactionId, p_payload: event })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) { console.error('OPay webhook failed:', error); return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 }) }
}
