'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-emerald-600/20">
            M
          </div>
          <div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">Materna AI</span>
            <span className="text-[10px] ml-2 font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Continuity-of-Care Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/clinician/dashboard"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition hidden sm:inline"
          >
            Hospital Portal
          </Link>
          <Link
            href="/patient/dashboard"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition hidden sm:inline"
          >
            Patient App
          </Link>
          <Link
            href="/offline-channels"
            className="text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition hidden md:inline"
          >
            📱 WhatsApp & USSD
          </Link>
          <Link
            href="/clinician/dashboard"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-emerald-600/20"
          >
            Open Live Demo 🚀
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 max-w-5xl mx-auto text-center space-y-7">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Competition Submission Demo · August 2026
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Closing the loop between{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            clinical care
          </span>{' '}
          and daily patient life in Nigeria.
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Materna AI unites hospital visits, explainable risk prediction, plain-language patient companion, and doorstep medication delivery for pregnant mothers and chronic disease patients.
        </p>

        {/* Primary Call to Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link
            href="/clinician/dashboard"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
          >
            <span>👩‍⚕️</span> Provider & Hospital Portal
          </Link>
          <Link
            href="/patient/dashboard"
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg shadow-rose-600/20 flex items-center gap-2"
          >
            <span>🤰</span> Patient App (Amaka 32w)
          </Link>
          <Link
            href="/offline-channels"
            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold px-5 py-3.5 rounded-2xl text-sm transition shadow-sm flex items-center gap-2"
          >
            <span>📟</span> WhatsApp & USSD Mode
          </Link>
        </div>
      </section>

      {/* Interactive Demo Surfaces Switchboard */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
            COMPREHENSIVE END-TO-END DEMO SUITE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Explore All 7 Surfaces of Materna AI
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Click into any role below to experience the complete closed data loop in action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Provider Dashboard */}
          <Link
            href="/clinician/dashboard"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-emerald-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl">
              🏥
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Hospital Surface</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition mt-0.5">
                Provider & Triage Dashboard
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Green/Amber/Red patient panel with explainable driving factors, active Red-tier SLA countdown timer, and 1-tap intake.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-2">
              Launch Portal →
            </span>
          </Link>

          {/* Card 2: Structured Visit Entry */}
          <Link
            href="/clinician/visit?patient_id=MAT-AMK-2026"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-teal-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl">
              📝
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Clinical Data Ingestion</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition mt-0.5">
                Structured Visit Entry
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Faster than paper vitals entry, maternal fundal/fetal checks, urinalysis dipstick, and instantaneous live AI risk preview.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 flex items-center gap-1 pt-2">
              Test Live Visit Entry →
            </span>
          </Link>

          {/* Card 3: Patient App */}
          <Link
            href="/patient/dashboard"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-rose-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center text-xl">
              🤰
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Patient Surface</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition mt-0.5">
                Maternal Companion (Amaka, 32w)
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Plain-language health status (no medical jargon), 32-week pregnancy journey, baby milestones, and caregiver permissions.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1 pt-2">
              Open Patient App →
            </span>
          </Link>

          {/* Card 4: AI Copilot & Safety Interceptor */}
          <Link
            href="/patient/chat"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-purple-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">AI Intelligence</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition mt-0.5">
                RAG Copilot & Red-Flag Triage
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Grounded in patient's actual hospital record. Powered by Groq LLaMA 3.3 70B with pre-model English and Pidgin emergency triage.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 flex items-center gap-1 pt-2">
              Chat with Copilot →
            </span>
          </Link>

          {/* Card 5: Prescription & Delivery */}
          <Link
            href="/patient/medications"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-blue-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl">
              💊
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Fulfillment Loop</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition mt-0.5">
                Medication Delivery Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Prescription-linked ordering with Medplus/HealthPlus. Live status from pharmacy dispense to medical dispatch rider.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 flex items-center gap-1 pt-2">
              View Delivery Tracker →
            </span>
          </Link>

          {/* Card 6: CHW Portal */}
          <Link
            href="/chw"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-teal-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl">
              🏡
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Community Outreach</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition mt-0.5">
                CHW Home Visit Portal
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Lightweight, offline-enabled interface for field community health workers to record home BP readings and escalate to nurses.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 flex items-center gap-1 pt-2">
              Open CHW Portal →
            </span>
          </Link>

          {/* Card 7: Low Connectivity Hub */}
          <Link
            href="/offline-channels"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-amber-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl">
              📱
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Low-Connectivity Channels</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition mt-0.5">
                WhatsApp Bot & USSD (*384*628#)
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Interactive simulator demonstrating access on feature phones and WhatsApp without requiring constant high-speed data.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1 pt-2">
              Try WhatsApp / USSD →
            </span>
          </Link>

          {/* Card 8: Specialist Referrals & FHIR */}
          <Link
            href="/clinician/referrals"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-cyan-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-xl">
              🏥
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Interoperability</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition mt-0.5">
                Specialist Referral & FHIR Export
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Pre-triaged patient packages to LUTH / National Hospital with standard HL7 FHIR R4 Bundle exports for Helium Health EMRs.
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-700 flex items-center gap-1 pt-2">
              Review Referrals & FHIR →
            </span>
          </Link>

          {/* Card 9: Self-Monitoring Log */}
          <Link
            href="/patient/log"
            className="group bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-emerald-500 rounded-3xl p-6 transition space-y-3 shadow-sm hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Continuous Monitoring</span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition mt-0.5">
                Patient Vitals & Symptom Self-Log
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Home Omron BP cuff entry, blood glucose, fetal kick counter, and instant AI feedback on health trends.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-2">
              Log Home Reading →
            </span>
          </Link>
        </div>
      </section>

      {/* The Core Differentiating Insight: Closed Loop */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-slate-200">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
            WHY MATERNA AI WINS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            Closed-Loop Data, Not a Disconnected Point Solution
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In Nigeria today, patient education apps, EMR hospital systems, and pharmacy delivery apps exist as disconnected silos. Materna AI is the <strong>connective tissue</strong>: the exact vitals a nurse records at Lagos Maternity becomes the data the AI risk model reasons over, the data that alerts Dr. Bello, and the data that triggers a doorstep medication refill.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-emerald-700 block">1. Structured Visit</span>
              <p className="text-slate-500 text-[11px]">Nurse enters BP & urinalysis in structured form faster than paper.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-amber-700 block">2. Explainable AI</span>
              <p className="text-slate-500 text-[11px]">Risk model flags Pre-eclampsia with specific driving factors.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-rose-700 block">3. Patient App</span>
              <p className="text-slate-500 text-[11px]">Translates clinical findings into reassuring, plain-language guidance.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-blue-700 block">4. Direct Refill</span>
              <p className="text-slate-500 text-[11px]">Partner pharmacy dispenses and delivers prescribed Methyldopa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-6 text-center text-xs text-slate-500 space-y-2 bg-white">
        <p className="font-bold text-slate-700">
          Materna AI — An AI-Powered Continuity-of-Care Platform for Maternal & Chronic Disease Patients.
        </p>
        <p>Built for Nigeria & Africa · NDPR Compliant Clinical Decision Support · Lagos, Abuja, Kano</p>
      </footer>
    </div>
  )
}
