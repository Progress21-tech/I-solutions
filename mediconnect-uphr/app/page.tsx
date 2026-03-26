'use client'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b">
        <h1 className="text-2xl font-bold text-blue-600">UPHR</h1>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          Get Started
        </button>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <span className="bg-blue-50 text-blue-600 text-sm font-medium px-4 py-2 rounded-full">
          Unified Patient Health Record
        </span>
        <h2 className="text-5xl font-bold text-gray-900 mt-6 leading-tight">
          Your health record,
          <span className="text-blue-600"> anywhere in the world</span>
        </h2>
        <p className="text-gray-500 text-lg mt-6 max-w-2xl mx-auto">
          One secure digital health identity that travels with you. 
          Any doctor, any hospital, any city — your complete medical 
          history is always accessible.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition text-lg"
          >
            Create Your Health ID
          </button>
          <button
            onClick={() => router.push('/login')}
            className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-medium hover:border-gray-300 transition text-lg"
          >
            I am a Clinician
          </button>
        </div>
      </div>

      {/* Problem Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            The problem we are solving
          </h3>
          <p className="text-gray-500 max-w-2xl mx-auto mb-12">
            In Nigeria and across Africa, patient records are fragmented, 
            paper-based, and trapped in individual hospitals. This costs lives.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 text-left">
              <div className="text-3xl mb-4">📋</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Fragmented Records
              </h4>
              <p className="text-gray-500 text-sm">
                Your medical history is scattered across every hospital 
                you have ever visited with no way to connect them.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-left">
              <div className="text-3xl mb-4">🔄</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Repeated Tests
              </h4>
              <p className="text-gray-500 text-sm">
                Doctors repeat expensive tests because they cannot access 
                results from your previous hospital visits.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-left">
              <div className="text-3xl mb-4">⚠️</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Dangerous Gaps
              </h4>
              <p className="text-gray-500 text-sm">
                Critical information like allergies and chronic conditions 
                is unknown to new doctors, putting patients at risk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            How UPHR works
          </h3>
          <p className="text-gray-500 max-w-2xl mx-auto mb-12">
            A simple, secure system that puts patients in control 
            of their own health records.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="border-2 border-blue-100 rounded-2xl p-6">
              <div className="text-3xl mb-4">🆔</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                One Health ID
              </h4>
              <p className="text-gray-500 text-sm">
                Every patient gets a unique health ID and QR code. 
                Show it at any hospital worldwide to share your records instantly.
              </p>
            </div>
            <div className="border-2 border-blue-100 rounded-2xl p-6">
              <div className="text-3xl mb-4">☁️</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                Cloud Stored
              </h4>
              <p className="text-gray-500 text-sm">
                Your records are securely stored in the cloud — 
                accessible from Lagos, Abuja, London or anywhere in the world.
              </p>
            </div>
            <div className="border-2 border-blue-100 rounded-2xl p-6">
              <div className="text-3xl mb-4">🤖</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                AI Health Assistant
              </h4>
              <p className="text-gray-500 text-sm">
                Our AI explains your medical records in plain language 
                you can understand — no medical jargon.
              </p>
            </div>
            <div className="border-2 border-blue-100 rounded-2xl p-6">
              <div className="text-3xl mb-4">🔒</div>
              <h4 className="font-semibold text-gray-800 mb-2">
                You Are In Control
              </h4>
              <p className="text-gray-500 text-sm">
                You decide who sees your records. Every access is logged 
                so you always know who viewed your health data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Take control of your health records today
          </h3>
          <p className="text-blue-200 mb-8">
            Free for patients. Always.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition text-lg"
          >
            Create Your Free Health ID
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 border-t text-center">
        <p className="text-gray-400 text-sm">
          © 2026 UPHR — Unified Patient Health Record. 
          Built for Africa, designed for the world.
        </p>
      </div>
    </div>
  )
}
