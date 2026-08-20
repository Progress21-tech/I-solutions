'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

declare global { interface Window { webpayCheckout?: (input: Record<string, unknown>) => void } }
const plans: Record<string, string> = { basic: 'Basic', pro: 'Pro' }

function PaymentPage() {
  const router = useRouter(), plan = useSearchParams().get('plan') || 'basic'
  const [loading, setLoading] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')
  const pay = async () => {
    if (!plans[plan]) { setError('Please select a valid subscription plan.'); return }
    setLoading(true); setError(''); setMessage('')
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) { router.replace('/login'); return }
    try {
      const response = await fetch('/api/payments/intents', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session.access_token}` }, body: JSON.stringify({ plan, provider: 'interswitch' }) })
      const intent = await response.json()
      if (!response.ok) { setError(intent.error || 'Unable to create payment request.'); return }
      const { checkout } = intent as { reference: string; amountKobo: number; checkout: { scriptUrl: string; merchantCode: string; payItemId: string } }
      const script = document.createElement('script'); script.src = checkout.scriptUrl; script.async = true
      script.onload = () => {
        if (!window.webpayCheckout) { setError('Interswitch checkout did not load. Please try again.'); setLoading(false); return }
        window.webpayCheckout({ merchant_code: checkout.merchantCode, pay_item_id: checkout.payItemId, amount: intent.amountKobo, currency: 566, txn_ref: intent.reference, site_redirect_url: `${window.location.origin}/clinician/dashboard?payment=pending`, onComplete: () => { setMessage('Payment received. Your subscription will activate only after secure server verification.'); setLoading(false) }, onError: () => { setError('Payment could not be completed. No subscription was activated.'); setLoading(false) } })
      }
      script.onerror = () => { setError('Unable to load secure checkout. Please try again.'); setLoading(false) }
      document.body.appendChild(script)
    } catch { setError('Unable to start payment. Please try again.'); setLoading(false) }
  }
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white px-6 py-4"><button onClick={() => router.back()} className="font-semibold text-blue-800 underline">← Back</button></header><section className="mx-auto max-w-md p-6"><div className="rounded-2xl bg-white p-7 shadow-sm"><h1 className="text-2xl font-bold text-slate-950">{plans[plan]} clinician plan</h1><p className="mt-2 text-sm leading-6 text-slate-700">Your final payment amount is calculated securely on the server. A client callback never activates your subscription.</p>{message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}<button onClick={() => void pay()} disabled={loading} className="mt-6 w-full rounded-xl bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{loading ? 'Opening secure checkout…' : 'Pay securely with Interswitch'}</button><p className="mt-4 text-xs leading-5 text-slate-600">OPay payment acceptance is handled through its signed server webhook after the merchant checkout product is configured. Do not treat a browser success message as payment confirmation.</p></div></section></main>
}
export default function Page() { return <Suspense fallback={<main className="min-h-screen grid place-items-center">Loading…</main>}><PaymentPage /></Suspense> }
