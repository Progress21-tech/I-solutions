import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'
import { verifyInterswitchWebhook } from '@/lib/payments/webhooks'

export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifyInterswitchWebhook(raw, request.headers.get('x-interswitch-signature'))) return new NextResponse(null, { status: 401 })
  try {
    const event = JSON.parse(raw) as { uuid?: string; data?: Record<string, unknown> }
    const data = event.data || {}; const reference = String(data.merchantReference || data.MerchantReference || '')
    const paidAmount = Number(data.amount || data.Amount); const providerReference = String(data.paymentReference || data.PaymentReference || data.retrievalReferenceNumber || '')
    if (!reference || !Number.isSafeInteger(paidAmount) || !providerReference) return new NextResponse(null, { status: 400 })
    const queryUrl = process.env.INTERSWITCH_TRANSACTION_QUERY_URL, merchantCode = process.env.INTERSWITCH_MERCHANT_CODE
    if (!queryUrl || !merchantCode) return new NextResponse(null, { status: 503 })
    const url = new URL(queryUrl); url.searchParams.set('merchantcode', merchantCode); url.searchParams.set('transactionreference', reference); url.searchParams.set('amount', String(paidAmount))
    const confirmation = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' }); const confirmed = await confirmation.json() as { ResponseCode?: string; Amount?: number; PaymentReference?: string }
    if (!confirmation.ok || confirmed.ResponseCode !== '00' || Number(confirmed.Amount) !== paidAmount) return new NextResponse(null, { status: 400 })
    const admin = getAdminSupabase(); const { error } = await admin.rpc('settle_payment_intent', { p_reference: reference, p_provider_reference: confirmed.PaymentReference || providerReference, p_provider: 'interswitch', p_amount_kobo: paidAmount, p_event_id: event.uuid || providerReference, p_payload: event })
    if (error) throw error
    return new NextResponse(null, { status: 200 })
  } catch (error) { console.error('Interswitch webhook failed:', error); return new NextResponse(null, { status: 500 }) }
}
