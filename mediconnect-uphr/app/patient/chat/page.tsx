'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/components/LanguageProvider'
import { supportedLanguages } from '@/lib/languages'
import {
  PatientRecord,
  getStoredPatients,
  getStoredVisits
} from '@/lib/data/records-data'
import { checkRedFlagSafety } from '@/lib/ai/safety-interceptor'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

export default function PatientChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [isListening, setIsListening] = useState(false)
  const [voiceNotice, setVoiceNotice] = useState('')
  const [emergencyModal, setEmergencyModal] = useState<{
    show: boolean
    reason: string
  }>({ show: false, reason: '' })
  const [showDoctorModal, setShowDoctorModal] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const router = useRouter()
  const { language, copy } = useLanguage()

  useEffect(() => {
    const list = getStoredPatients()
    const found = list.find((p) => p.health_id === 'MAT-AMK-2026') || list[0]
    if (found) {
      setPatient(found)
      const v = getStoredVisits(found.id)
      setRecords(v)

      // Initial grounded greeting
      const greeting = `Hello ${found.full_name.split(' ')[0]}! I am your Materna AI Copilot. 

I can see your continuity health record from Lagos Island Maternity & LUTH. You are currently at **${found.gestational_weeks || 32} weeks gestation**, and we are watching your blood pressure (**${found.risk_driving_factors[0] || '148/96 mmHg'}**) closely.

How can I help you today? You can ask about your symptoms, your prescribed Methyldopa, what to eat, or baby kicks.`
      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (overrideText?: string) => {
    const userText = (overrideText || input).trim()
    if (!userText || loading) return

    // 1. Safety Check: Emergency Red-Flag Interceptor
    const safety = checkRedFlagSafety(userText)
    if (safety.isEmergency) {
      setEmergencyModal({
        show: true,
        reason: safety.redFlagReason || 'Emergency clinical danger sign detected.'
      })
    }

    const updatedMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(updatedMessages)
    if (!overrideText) setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          patient,
          records,
          language
        })
      })
      const data = await response.json()
      if (response.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'I am currently experiencing network delays, but your clinical record is safe. If you have severe symptoms, please call emergency services immediately.'
          }
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I could not reach the server right now. Please check your connection or contact your doctor at Lagos Island Maternity.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    setVoiceNotice('')
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Recognition) {
      setVoiceNotice('Voice input is not supported on this browser.')
      return
    }
    const recognition = new Recognition()
    recognition.lang = supportedLanguages[language].voiceLocale
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      setInput((curr) => `${curr}${curr ? ' ' : ''}${event.results[0][0].transcript}`)
    }
    recognition.onerror = () => setVoiceNotice('Voice input error occurred.')
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
  }

  const speak = (content: string) => {
    setVoiceNotice('')
    if (!('speechSynthesis' in window)) {
      setVoiceNotice('Audio voice reading is unavailable.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.lang = supportedLanguages[language].voiceLocale
    const matchingVoice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase() === utterance.lang.toLowerCase())
    if (matchingVoice) utterance.voice = matchingVoice
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white font-bold text-sm">
            ←
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-sm">Materna AI Copilot</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-emerald-400">Grounded in Dr. Bello's Clinical Records</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDoctorModal(true)}
            className="bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow"
          >
            <span>👩‍⚕️</span> Talk to Doctor
          </button>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Suggested Query Pills */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
        <span className="text-slate-500 text-[11px] font-semibold shrink-0">Suggestions:</span>
        <button
          onClick={() => sendMessage('Is my blood pressure of 148/96 safe for 32 weeks?')}
          className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1 rounded-full border border-slate-700 text-[11px]"
        >
          🫀 Is my BP of 148/96 safe?
        </button>
        <button
          onClick={() => sendMessage('How often should I feel baby kicks at 32 weeks?')}
          className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1 rounded-full border border-slate-700 text-[11px]"
        >
          🦶 How many baby kicks?
        </button>
        <button
          onClick={() => sendMessage('How do I order my Methyldopa refill for delivery?')}
          className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1 rounded-full border border-slate-700 text-[11px]"
        >
          💊 Order Methyldopa Refill
        </button>
        <button
          onClick={() => sendMessage('I have severe headache with blurry vision and bleeding')}
          className="bg-rose-950/80 text-rose-300 border border-rose-700 px-3 py-1 rounded-full text-[11px] font-bold"
        >
          🚨 Test Red-Flag Alert
        </button>
      </div>

      {/* Chat Messages Body */}
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-4 max-w-xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.role === 'assistant' && (
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => speak(msg.content)}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>🔊</span> Read Aloud
                  </button>
                  <button
                    onClick={() => window.speechSynthesis?.cancel()}
                    className="text-slate-500 hover:text-slate-400"
                  >
                    Stop
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-slate-400 animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Materna AI is reviewing your records...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Clinical Decision Support Disclaimer */}
      <aside className="bg-slate-900/90 border-t border-slate-800 px-4 py-1.5 text-center text-[10px] text-slate-400 max-w-xl mx-auto w-full">
        🔒 Clinical Decision Support: Materna AI provides grounded guidance and does not replace your doctor's orders.
      </aside>

      {/* Input Area */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-3 max-w-xl mx-auto w-full flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a question about your pregnancy, blood pressure, or baby..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
        />

        <button
          type="button"
          onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
          className={`p-2.5 rounded-xl border font-bold text-sm transition ${
            isListening
              ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Voice input in English, Pidgin, Yoruba, Hausa, Igbo"
        >
          🎙️
        </button>

        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-md shadow-pink-950"
        >
          Send
        </button>
      </footer>

      {/* Emergency Red-Flag Interceptor Modal */}
      {emergencyModal.show && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-rose-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">🚨</span>
                <div>
                  <h3 className="text-base font-black text-rose-200">EMERGENCY TRIAGE ALERT</h3>
                  <p className="text-[11px] text-rose-300">Potential Life-Threatening Obstetric Flag</p>
                </div>
              </div>
              <button
                onClick={() => setEmergencyModal({ show: false, reason: '' })}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="bg-rose-950/80 border border-rose-700 p-3.5 rounded-2xl text-rose-100 space-y-1.5">
              <p className="font-bold">Symptoms Identified: {emergencyModal.reason}</p>
              <p className="text-[11px] leading-relaxed text-rose-200">
                Please do not wait. Lie on your left side and have someone drive you to the nearest hospital labor unit immediately.
              </p>
            </div>

            {/* Direct 1-Tap Emergency Hotlines */}
            <div className="space-y-2">
              <span className="font-bold text-white block text-[11px] uppercase tracking-wider">
                1-Tap Emergency Dispatch Lines:
              </span>
              <a
                href="tel:112"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl transition"
              >
                <span>📞</span> Call 112 / 767 (Toll-Free Emergency)
              </a>
              <a
                href="tel:+2348029990011"
                className="w-full bg-slate-800 hover:bg-slate-700 text-rose-200 border border-rose-700 font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition"
              >
                <span>🏥</span> Call Lagos Island Maternity Triage
              </a>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setEmergencyModal({ show: false, reason: '' })}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold underline"
              >
                I am already at the clinic / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Talk to Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Contact Your Clinical Care Team</h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-slate-400 text-base">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Dr. Bello Adeyemi</p>
                  <p className="text-slate-400 text-[11px]">Chief Medical Officer · Lagos Island Maternity</p>
                </div>
                <a
                  href="tel:+2348035550192"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
                >
                  📞 Call
                </a>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">Nurse Ifeoma Eze</p>
                  <p className="text-slate-400 text-[11px]">Senior Antenatal Triage Nurse</p>
                </div>
                <a
                  href="tel:+2348035550192"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDoctorModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
        <Link href="/patient/chat" className="text-center text-pink-400 flex flex-col items-center gap-0.5">
          <span className="text-base">🤖</span>
          <span className="text-[10px] font-bold">AI Copilot</span>
        </Link>
        <Link href="/patient/log" className="text-center text-slate-400 hover:text-slate-200 flex flex-col items-center gap-0.5">
          <span className="text-base">📊</span>
          <span className="text-[10px] font-bold">Log Vitals</span>
        </Link>
      </nav>
    </div>
  )
}
