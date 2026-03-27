'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ClinicianPendingPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">

        <div className="text-5xl mb-4">🕐</div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Verification in Progress
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Thank you for submitting your details. Our team is reviewing your
          medical license and credentials. This typically takes{' '}
          <span className="font-medium text-gray-700">1–2 business days</span>.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-left mb-6">
          <p className="text-sm text-green-700 font-medium mb-1">What happens next?</p>
          <ul className="text-sm text-green-600 space-y-1 list-disc list-inside">
            <li>We verify your license number with MDCN</li>
            <li>You'll receive an email once approved</li>
            <li>Then you can log in and access the clinician dashboard</li>
          </ul>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full py-3 border-2 border-gray-200 text-gray-500 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
        >
          Sign out for now
        </button>

      </div>
    </div>
  )
}
