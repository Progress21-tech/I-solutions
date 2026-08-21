'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  PatientRecord,
  SelfLoggedReading,
  addSelfLoggedReading,
  getStoredPatients,
  getStoredSelfLogs
} from '@/lib/data/records-data'
import { checkRedFlagSafety } from '@/lib/ai/safety-interceptor'

function PatientLogContent() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || 'blood_pressure'

  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [logType, setLogType] = useState<string>(initialType)
  const [systolic, setSystolic] = useState('146')
  const [diastolic, setDiastolic] = useState('94')
  const [glucose, setGlucose] = useState('110')
  const [kickCount, setKickCount] = useState(10)
  const [kickDuration, setKickDuration] = useState(30)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [logs, setLogs] = useState<SelfLoggedReading[]>([])
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null)
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null)

  useEffect(() => {
    const list = getStoredPatients()
    const found = list.find((p) => p.health_id === 'MAT-AMK-2026') || list[0]
    if (found) {
      setPatient(found)
      setLogs(getStoredSelfLogs(found.id))
    }
  }, [])

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym))
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym])
    }
  }

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient) return
    setSavedFeedback(null)
    setEmergencyAlert(null)

    const sys = Number(systolic)
    const dia = Number(diastolic)
    const glu = Number(glucose)

    let feedback = ''
    let isRed = false

    // Safety Red flag check on notes or symptoms
    const joinedText = `${selectedSymptoms.join(' ')} ${notes}`
    const safetyCheck = checkRedFlagSafety(joinedText)

    if (safetyCheck.isEmergency) {
      isRed = true
      setEmergencyAlert(safetyCheck.redFlagReason || 'Emergency danger signs detected.')
    }

    if (logType === 'blood_pressure') {
      if (sys >= 140 || dia >= 90) {
        isRed = true
        feedback = `Your blood pressure (${sys}/${dia} mmHg) is elevated above your normal target. Please sit down, rest with feet elevated, and ensure you have taken your prescribed Methyldopa. If you have severe headache or blurry vision, call the hospital immediately.`
      } else {
        feedback = `Your blood pressure (${sys}/${dia} mmHg) is in a healthy range today. Keep up your routine!`
      }
    } else if (logType === 'fetal_kicks') {
      if (kickCount >= 10) {
        feedback = `Reassuring fetal movement! ${kickCount} kicks in ${kickDuration} minutes indicates good fetal well-being at 32 weeks.`
      } else {
        isRed = true
        feedback = `Low kick count (${kickCount} kicks in ${kickDuration} minutes). Please drink cold water, lie on your left side for 1 hour, and recount. If movement is still slow, contact the maternity ward.`
      }
    } else if (logType === 'blood_glucose') {
      if (glu > 140) {
        feedback = `Blood glucose (${glu} mg/dL) is slightly above fasting goal. Note down what you ate and stay hydrated.`
      } else {
        feedback = `Blood glucose (${glu} mg/dL) is well-regulated.`
      }
    } else {
      feedback = `Symptoms logged and updated in your continuity record. Your care team has been alerted.`
    }

    const newLog: SelfLoggedReading = {
      id: `log-${Date.now()}`,
      patient_id: patient.id,
      timestamp: new Date().toISOString(),
      reading_type: logType as any,
      systolic: logType === 'blood_pressure' ? sys : undefined,
      diastolic: logType === 'blood_pressure' ? dia : undefined,
      glucose_level: logType === 'blood_glucose' ? glu : undefined,
      kick_count: logType === 'fetal_kicks' ? kickCount : undefined,
      duration_minutes: logType === 'fetal_kicks' ? kickDuration : undefined,
      symptoms: selectedSymptoms,
      notes,
      ai_feedback: feedback,
      is_flagged_red: isRed
    }

    addSelfLoggedReading(newLog)
    setLogs(getStoredSelfLogs(patient.id))
    setSavedFeedback(feedback)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/patient/dashboard" className="text-slate-400 hover:text-white text-xs font-bold">
            ← Home
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="font-bold text-white text-sm">Self-Monitoring & Vitals Log</h1>
        </div>
        <span className="text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800/40 px-2.5 py-1 rounded-full">
          Instant AI Feedback
        </span>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-5 space-y-6">
        {/* Emergency Alert Box if Triggered */}
        {emergencyAlert && (
          <div className="bg-rose-950 border-2 border-rose-500 text-rose-100 p-4 rounded-2xl text-xs space-y-2.5 animate-pulse">
            <div className="flex items-center gap-2 font-black text-sm text-rose-300">
              <span>🚨</span> CRITICAL DANGER WARNING
            </div>
            <p className="leading-relaxed">{emergencyAlert}</p>
            <div className="flex gap-2 pt-1">
              <a
                href="tel:112"
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                📞 Call 112 / 767 Emergency
              </a>
              <a
                href="tel:+2348029990011"
                className="bg-slate-800 hover:bg-slate-700 text-rose-200 border border-rose-700 px-3 py-2 rounded-xl text-xs font-bold"
              >
                Call Lagos Maternity
              </a>
            </div>
          </div>
        )}

        {/* AI Immediate Feedback */}
        {savedFeedback && !emergencyAlert && (
          <div className="bg-slate-900 border border-emerald-500/80 p-4 rounded-2xl text-xs space-y-2 text-slate-200 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span>🤖</span> Materna AI Health Feedback
              </span>
              <span className="text-[10px] text-slate-400">Just Now</span>
            </div>
            <p className="leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              {savedFeedback}
            </p>
          </div>
        )}

        {/* Log Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-xs text-white uppercase tracking-wider">
              Select Reading Type
            </h2>
          </div>

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-4 gap-2 text-xs font-bold">
            {[
              { id: 'blood_pressure', label: '🫀 BP Cuff' },
              { id: 'fetal_kicks', label: '🦶 Kicks' },
              { id: 'blood_glucose', label: '🩸 Sugar' },
              { id: 'symptoms', label: '⚠️ Symptoms' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLogType(tab.id)}
                className={`py-2 px-1 rounded-xl border text-center transition ${
                  logType === tab.id
                    ? 'bg-purple-950 border-purple-500 text-purple-200 ring-1 ring-purple-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveLog} className="space-y-4 text-xs pt-2">
            {/* Blood Pressure form */}
            {logType === 'blood_pressure' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Systolic (Top number)
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Diastolic (Bottom number)
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Fetal Kicks form */}
            {logType === 'fetal_kicks' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Kicks Counted</span>
                    <span className="text-2xl font-black text-pink-300 font-mono">{kickCount} Kicks</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setKickCount((k) => Math.max(0, k - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 text-lg font-bold hover:bg-slate-700"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setKickCount((k) => k + 1)}
                      className="w-10 h-10 rounded-xl bg-pink-600 text-white text-lg font-bold hover:bg-pink-500 shadow"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={kickDuration}
                    onChange={(e) => setKickDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
            )}

            {/* Blood Glucose form */}
            {logType === 'blood_glucose' && (
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Blood Glucose Reading (mg/dL)
                </label>
                <input
                  type="number"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm"
                />
              </div>
            )}

            {/* Symptoms checklist */}
            <div>
              <label className="block text-slate-300 font-bold mb-2">
                Any symptoms right now? (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Frontal headache',
                  'Blurry vision / Seeing spots',
                  'Ankle / Hand swelling',
                  'Upper belly / Rib pain',
                  'Dizziness or fatigue'
                ].map((sym) => {
                  const active = selectedSymptoms.includes(sym)
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                        active
                          ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {active ? '✓ ' : '+ '} {sym}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Personal Notes</label>
              <input
                type="text"
                placeholder="e.g. Measured after resting 10 mins with feet elevated"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-2xl transition shadow-lg text-sm"
            >
              💾 Save Entry & Analyze
            </button>
          </form>
        </div>

        {/* Previous Self Logs History */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 text-xs">
          <h3 className="font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Recent Self-Logs ({logs.length})
          </h3>

          <div className="space-y-2.5">
            {logs.map((item) => (
              <div key={item.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white capitalize">
                    {item.reading_type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                {item.systolic && (
                  <p className="text-slate-300">
                    Reading: <strong className="text-white font-mono">{item.systolic}/{item.diastolic} mmHg</strong>
                  </p>
                )}
                {item.kick_count && (
                  <p className="text-slate-300">
                    Kicks: <strong className="text-pink-300">{item.kick_count} kicks</strong> ({item.duration_minutes}m)
                  </p>
                )}
                {item.ai_feedback && (
                  <p className="text-[11px] text-emerald-300/90 italic bg-slate-900/60 p-2 rounded-lg">
                    AI: {item.ai_feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur px-6 py-2.5 flex items-center justify-around z-40 max-w-xl mx-auto">
        <Link href="/patient/dashboard" className="text-center text-slate-400 hover:text-slate-200 flex flex-col items-center gap-0.5">
          <span className="text-base">🏠</span>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link href="/patient/medications" className="text-center text-slate-400 hover:text-slate-200 flex flex-col items-center gap-0.5">
          <span className="text-base">💊</span>
          <span className="text-[10px] font-bold">Meds & Refills</span>
        </Link>
        <Link href="/patient/chat" className="text-center text-slate-400 hover:text-slate-200 flex flex-col items-center gap-0.5">
          <span className="text-base">🤖</span>
          <span className="text-[10px] font-bold">AI Copilot</span>
        </Link>
        <Link href="/patient/log" className="text-center text-purple-400 flex flex-col items-center gap-0.5">
          <span className="text-base">📊</span>
          <span className="text-[10px] font-bold">Log Vitals</span>
        </Link>
      </nav>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 p-6 text-white">Loading log...</div>}>
      <PatientLogContent />
    </Suspense>
  )
}
