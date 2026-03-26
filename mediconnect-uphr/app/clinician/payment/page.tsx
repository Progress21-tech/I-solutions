'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const planDetails = {
  basic: {
    name: 'Basic Plan',
    price: 15000,
    description: 'Up to 50 patient record accesses/month',
  },
  pro: {
    name: 'Pro Plan',
    price: 45000,
    description: 'Unlimited accesses + AI summaries',
  },
}

function PaymentPage() {
  const [clinician, setClinician] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const planKey = searchParams.get('plan') as 'basic' | 'pro' || 'basic'
  const plan = planDetails[planKey]

  useEffect(() => {
    fetchClinician()
  }, [])

  const fetchClinician = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('clinicians')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setClinician(data)
    setLoading(false)
  }

  const handlePayment = () => {
    setPaying(true)

    // Load Interswitch inline checkout
    const script = document.createElement('script')
    script.src = 'https://newwebpay.interswitchng.com/inline-checkout.js'
    script.onload = () => {
      const paymentData = {
        merchant_code: process.env.NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE,
        pay_item_id: process.env.NEXT_PUBLIC_INTERSWITCH_PAY_ITEM_ID,
        amount: plan.price * 100, // in kobo
        currency: 566, // NGN
        site_redirect_url: `${window.location.origin}/clinician/payment/verify`,
        txn_ref: `UPHR-${Date.now()}`,
        onComplete: async (response: any) => {
          if (response.resp === '00') {
            // Payment successful — save subscription
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('access_grants').insert({
              clinician_id: clinician.id,
              patient_id: null,
              payment_confirmed: true,
              payment_reference: response.txnref,
              expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            router.push('/clinician/dashboard?payment=success')
          } else {
            setPaying(false)
            alert('Payment failed. Please try again.')
          }
        },
        onError: () => {
          setPaying(false)
          alert('Payment error. Please try again.')
        },
      }
      // @ts-ignore
      window.webpayCheckout(paymentData)
    }
    document.body.appendChild(script)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">UPHR</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back
        </button>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          {/* Plan Summary */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Complete Your Subscription
            </h2>
            <p className="text-gray-500 mt-2">
              You are subscribing to the {plan.name}
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">{plan.name}</span>
              <span className="font-semibold text-gray-800">
                ₦{plan.price.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-400">{plan.description}</p>
            <div className="border-t border-gray-200 mt-3 pt-3 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Total/month</span>
              <span className="font-bold text-blue-600 text-lg">
                ₦{plan.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Clinician Info */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-1">Subscribing as</p>
            <p className="font-medium text-gray-800">{clinician?.full_name}</p>
            <p className="text-sm text-gray-500">{clinician?.hospital_name}</p>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={paying}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {paying ? (
              'Processing...'
            ) : (
              <>
                <span>🔒</span>
                Pay ₦{plan.price.toLocaleString()} via Interswitch
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Secured by Interswitch. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <PaymentPage />
    </Suspense>
  )
}
