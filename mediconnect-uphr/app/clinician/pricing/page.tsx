'use client'
import { useRouter } from 'next/navigation'

const plans = [
  {
    name: 'Basic',
    price: '₦15,000',
    period: '/month',
    description: 'Perfect for solo clinicians and private doctors',
    features: [
      'Up to 50 patient record accesses/month',
      'Basic record view',
      'Single clinician account',
      'Email support',
    ],
    color: 'border-gray-200',
    buttonColor: 'bg-gray-800 hover:bg-gray-900',
    popular: false,
  },
  {
    name: 'Pro',
    price: '₦45,000',
    period: '/month',
    description: 'Ideal for small to medium clinics',
    features: [
      'Unlimited patient record accesses',
      'Up to 10 clinician accounts',
      'AI-powered patient summaries',
      'Audit logs',
      'Priority support',
    ],
    color: 'border-blue-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '₦150,000',
    period: '/month',
    description: 'Built for large hospitals and health systems',
    features: [
      'Unlimited everything',
      'Unlimited clinician accounts',
      'Bulk record upload',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
    color: 'border-gray-200',
    buttonColor: 'bg-gray-800 hover:bg-gray-900',
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()

  const handleSelectPlan = (planName: string) => {
    if (planName === 'Enterprise') {
      window.location.href = 'mailto:contact@uphr.health?subject=Enterprise Plan Enquiry'
      return
    }
    router.push(`/clinician/payment?plan=${planName.toLowerCase()}`)
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

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Choose the plan that fits your practice. 
            Patients always access their records for free.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-6 border-2 ${plan.color} relative`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Info */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {plan.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {plan.description}
                </p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-bold text-gray-800">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 mb-1">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span className="text-green-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(plan.name)}
                className={`w-full text-white py-3 rounded-xl font-medium transition ${plan.buttonColor}`}
              >
                {plan.name === 'Enterprise' ? 'Contact Us' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-400 text-sm mt-8">
          All plans include secure cloud storage, role-based access control, 
          and Interswitch-powered payments. Cancel anytime.
        </p>
      </div>
    </div>
  )
}