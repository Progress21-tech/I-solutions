'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ChatMessage {
  from: 'bot' | 'user'
  text: string
  time: string
}

export default function OfflineChannelsPage() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'ussd' | 'escalation'>('whatsapp')

  // WhatsApp bot interactive state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: 'bot',
      text: '🇳🇬 Hello Amaka! Welcome to Materna AI WhatsApp Careline (Lagos Island Maternity).\n\nReply with a number:\n1️⃣ Log today\'s Blood Pressure\n2️⃣ Count Baby Kicks (32w)\n3️⃣ Request Methyldopa Refill\n4️⃣ Ask a Pregnancy Question\n5️⃣ 🚨 Emergency Danger Help',
      time: '09:00'
    }
  ])
  const [inputMsg, setInputMsg] = useState('')

  // USSD interactive state
  const [ussdScreen, setUssdScreen] = useState<'dial' | 'menu' | 'bp_prompt' | 'bp_done' | 'refill_prompt' | 'refill_done'>('dial')
  const [ussdInput, setUssdInput] = useState('*384*628#')
  const [ussdResponse, setUssdResponse] = useState('')

  const handleSendWhatsApp = (customText?: string) => {
    const text = customText || inputMsg
    if (!text.trim()) return

    const newMsgs: ChatMessage[] = [...messages, { from: 'user', text, time: 'Now' }]
    setMessages(newMsgs)
    if (!customText) setInputMsg('')

    setTimeout(() => {
      let reply = ''
      const lower = text.toLowerCase()

      if (lower.includes('1') || lower.includes('bp') || lower.includes('pressure')) {
        reply = '🫀 Please reply with your BP numbers separated by a slash (e.g., 140/90).'
      } else if (lower.includes('/') && (lower.includes('14') || lower.includes('13') || lower.includes('12'))) {
        reply = '⚠️ We recorded your reading of ' + text + ' mmHg. This is above your target. Please take your prescribed Methyldopa and sit with feet elevated. A nurse has been alerted.'
      } else if (lower.includes('2') || lower.includes('kick')) {
        reply = '🦶 Baby kick counter: Did you feel 10 kicks in the last 2 hours? Reply YES or NO.'
      } else if (lower.includes('yes')) {
        reply = '✓ Reassuring fetal movements! Your record is updated.'
      } else if (lower.includes('3') || lower.includes('refill')) {
        reply = '💊 Refill requested for Methyldopa 250mg (14-day supply). Medplus Lekki has received your order. Delivery estimated within 45 mins.'
      } else if (lower.includes('5') || lower.includes('emergency') || lower.includes('bleed') || lower.includes('headache')) {
        reply = '🚨 EMERGENCY DETECTED: If you are bleeding or have severe headache with blurry vision, call 112 immediately or proceed to Lagos Island Maternity triage.'
      } else {
        reply = 'Thank you Amaka. Your message has been logged in your Materna AI health record. Dr. Bello\'s team is monitoring your pregnancy.'
      }

      setMessages((prev) => [...prev, { from: 'bot', text: reply, time: 'Now' }])
    }, 600)
  }

  const handleUssdSubmit = () => {
    if (ussdScreen === 'dial') {
      if (ussdInput.trim() === '*384*628#') {
        setUssdScreen('menu')
        setUssdInput('')
      } else {
        alert('Dial *384*628# to access Materna AI USSD Service')
      }
    } else if (ussdScreen === 'menu') {
      if (ussdInput === '1') {
        setUssdScreen('bp_prompt')
        setUssdInput('')
      } else if (ussdInput === '2') {
        setUssdScreen('refill_prompt')
        setUssdInput('')
      } else {
        setUssdScreen('menu')
      }
    } else if (ussdScreen === 'bp_prompt') {
      setUssdResponse(`BP ${ussdInput} recorded! Alert sent to Lagos Island Maternity triage.`)
      setUssdScreen('bp_done')
    } else if (ussdScreen === 'refill_prompt') {
      setUssdResponse('Refill confirmed! Medplus rider assigned for delivery to your registered address.')
      setUssdScreen('refill_done')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-800 text-xs font-bold">
            ← Home
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="font-bold text-slate-900 text-sm">Low-Connectivity Channels & Omnichannel Fallback</h1>
        </div>
        <span className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
          2G / Feature Phone / WhatsApp
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <span>💬</span> WhatsApp Careline Simulator
          </button>

          <button
            onClick={() => setActiveTab('ussd')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ussd'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <span>📟</span> USSD (*384*628#) Dialer Simulator
          </button>

          <button
            onClick={() => setActiveTab('escalation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'escalation'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <span>🚨</span> Multi-Tier Escalation Protocol
          </button>
        </div>

        {/* Tab 1: WhatsApp Bot Simulator */}
        {activeTab === 'whatsapp' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    WA
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Materna AI WhatsApp Bot</h3>
                    <p className="text-[11px] text-teal-700 font-semibold">Official Business Account · +234 800 MATERNA</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Encrypted</span>
              </div>

              {/* Chat messages viewport */}
              <div className="space-y-3 h-[380px] overflow-y-auto bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-xs ${
                        m.from === 'user'
                          ? 'bg-teal-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      {m.text}
                      <span className="block text-[9px] text-slate-400 text-right mt-1">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick response pills */}
              <div className="flex gap-1.5 overflow-x-auto text-[11px] pb-1">
                <button
                  onClick={() => handleSendWhatsApp('1')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shrink-0 border border-slate-200"
                >
                  1. Log BP
                </button>
                <button
                  onClick={() => handleSendWhatsApp('148/96')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shrink-0 border border-slate-200"
                >
                  148/96
                </button>
                <button
                  onClick={() => handleSendWhatsApp('3')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shrink-0 border border-slate-200"
                >
                  3. Refill Methyldopa
                </button>
                <button
                  onClick={() => handleSendWhatsApp('5')}
                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-2.5 py-1 rounded-lg shrink-0 border border-rose-200 font-bold"
                >
                  5. Emergency
                </button>
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message or menu number..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
                <button
                  onClick={() => handleSendWhatsApp()}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Explanatory Info */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Why WhatsApp Matters in Nigeria
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Over 90% of Nigerian Smartphone Users Live on WhatsApp
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For mothers who run out of high-speed web data, WhatsApp bundles are often zero-rated or dirt cheap on MTN, Airtel, and Glo. Materna AI offers full continuity through an official WhatsApp Bot:
                </p>
                <ul className="text-xs text-slate-700 space-y-2 pt-2">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span><strong>Automated Morning BP Prompt:</strong> Prompts high-risk mothers at 8:00 AM every morning.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span><strong>1-Click Refill Fulfillment:</strong> Integrates directly into the Medplus dispatch network.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span><strong>Emergency Interceptor:</strong> Immediately routes red-flag symptom keywords to the emergency hotline.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: USSD Feature Phone Simulator */}
        {activeTab === 'ussd' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Zero-Data Feature Phone Simulator (Nokia / Itel)
              </span>

              {/* Retro USSD Screen */}
              <div className="bg-slate-950 text-emerald-400 font-mono text-xs p-5 rounded-2xl shadow-inner min-h-[220px] flex flex-col justify-between text-left">
                {ussdScreen === 'dial' && (
                  <div>
                    <p className="text-slate-400 mb-2">Dial service code:</p>
                    <p className="text-emerald-300 font-bold text-sm">{ussdInput || '*384*628#'}</p>
                  </div>
                )}

                {ussdScreen === 'menu' && (
                  <div className="space-y-1 text-[11px]">
                    <p className="font-bold text-white mb-1">Materna AI Maternal Health:</p>
                    <p>1. Log Home BP</p>
                    <p>2. Request Med Refill</p>
                    <p>3. Baby Kick Status</p>
                    <p>4. Nurse Callback</p>
                  </div>
                )}

                {ussdScreen === 'bp_prompt' && (
                  <div className="space-y-1 text-[11px]">
                    <p className="font-bold text-white mb-1">Enter your BP:</p>
                    <p className="text-slate-400">e.g. 140/90</p>
                    <p className="text-yellow-300 font-bold">{ussdInput}</p>
                  </div>
                )}

                {ussdScreen === 'bp_done' && (
                  <div className="space-y-2 text-[11px]">
                    <p className="font-bold text-emerald-300">{ussdResponse}</p>
                    <p className="text-slate-400 text-[10px]">Session ended. SMS confirmation sent.</p>
                  </div>
                )}

                {ussdScreen === 'refill_prompt' && (
                  <div className="space-y-1 text-[11px]">
                    <p className="font-bold text-white mb-1">Refill Methyldopa 250mg?</p>
                    <p>Reply 1 to Confirm (₦4,500 on delivery)</p>
                  </div>
                )}

                {ussdScreen === 'refill_done' && (
                  <div className="space-y-2 text-[11px]">
                    <p className="font-bold text-emerald-300">{ussdResponse}</p>
                  </div>
                )}

                <div className="text-slate-500 text-[9px] border-t border-slate-800 pt-1 text-center">
                  Session Active · Zero Internet Required
                </div>
              </div>

              {/* Keypad Input */}
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Enter choice (1, 2...)"
                  value={ussdInput}
                  onChange={(e) => setUssdInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-slate-900 font-mono font-bold"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setUssdScreen('dial')
                      setUssdInput('*384*628#')
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl border border-slate-300"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleUssdSubmit}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl shadow-xs"
                  >
                    Send / OK
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Bridging the Deep Digital Divide
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                USSD (*384*628#) for Millions in Semi-Urban & Rural Nigeria
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                In northern Nigeria and rural riverine communities in the Niger Delta, over 55% of women do not own a smartphone. Materna AI works over standard GSM cellular signaling (USSD) with zero data bundle requirement:
              </p>

              <div className="space-y-3 text-xs pt-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">1. Universal Protocol</span>
                  <p className="text-slate-500 text-[11px]">Works on basic feature phones (Nokia 105, Itel) with no app download.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">2. Fast Clinical Sync</span>
                  <p className="text-slate-500 text-[11px]">Readings entered via USSD update Dr. Bello's hospital dashboard in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Multi-Tier Escalation */}
        {activeTab === 'escalation' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Fail-Safe Protocol
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                Multi-Tier Escalation for Unreachable High-Risk Patients
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                When an Amber or Red tier patient misses a daily check-in or logs a critical vital sign, Materna AI steps through automated fallback tiers:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Tier 1: Smartphone Push</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Sent via mobile app or WhatsApp. Acknowledged within 1 hour.
                </p>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                  Latency: 0-60 mins
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Tier 2: Direct SMS & Voice IVR</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  If unacknowledged, automated SMS and phone call in preferred local language (Yoruba/Hausa/Igbo).
                </p>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                  Latency: 1-2 hours
                </span>
              </div>

              <div className="bg-slate-50 border border-rose-200 p-5 rounded-2xl space-y-2 bg-rose-50/50">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h4 className="font-bold text-rose-900 text-sm">Tier 3: CHW In-Person Visit</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Dispatches assigned Community Health Worker (Amina Bello) to the patient's home address.
                </p>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 inline-block">
                  Guaranteed Contact &lt; 24h
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
