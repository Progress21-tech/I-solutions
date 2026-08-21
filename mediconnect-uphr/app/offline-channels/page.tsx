'use client'

import { useState } from 'react'
import Link from 'next/link'

interface WhatsAppMessage {
  sender: 'bot' | 'user'
  text: string
  time: string
}

export default function OfflineChannelsPage() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'ussd' | 'escalation'>('whatsapp')

  // WhatsApp State
  const [waMessages, setWaMessages] = useState<WhatsAppMessage[]>([
    {
      sender: 'bot',
      text: 'Good morning Amaka! This is Materna AI WhatsApp Assistant from Lagos Island Maternity 🏥\n\nYou are at 32 weeks today. How are you feeling this morning? Please reply with:\n\n1️⃣ Feeling Great & Healthy\n2️⃣ Mild Headache or Swelling\n3️⃣ Severe Pain, Bleeding or Blurry Vision\n4️⃣ Order Methyldopa Refill',
      time: '08:00 AM'
    }
  ])
  const [waInput, setWaInput] = useState('')

  const handleSendWhatsApp = (customText?: string) => {
    const text = (customText || waInput).trim()
    if (!text) return

    const newMsgs: WhatsAppMessage[] = [
      ...waMessages,
      { sender: 'user', text, time: 'Just now' }
    ]

    let reply = ''
    if (text === '1' || text.toLowerCase().includes('great')) {
      reply = 'Wonderful news! Remember to take your Pregnacare prenatal vitamins with lunch and keep well hydrated. Have a blessed day!'
    } else if (text === '2' || text.toLowerCase().includes('headache')) {
      reply = 'Thank you for reporting. Please rest with your feet elevated and take your morning Methyldopa (250mg) dose. We have logged this for Nurse Ifeoma. If your headache worsens, reply 3 or call 112.'
    } else if (text === '3' || text.toLowerCase().includes('severe')) {
      reply = '🚨 EMERGENCY ALERT! Please do not wait. Lie on your left side and go to Lagos Island Maternity Labor Unit immediately. Toll-Free Emergency: 112 / 767.'
    } else if (text === '4' || text.toLowerCase().includes('refill')) {
      reply = '📦 Refill Order Confirmed! Your 14-day supply of Methyldopa 250mg has been ordered from Medplus Lekki for doorstep delivery (₦4,500). Delivery rider will contact you.'
    } else {
      reply = `Thank you for your message. Materna AI has linked this to your continuous hospital health record. Reply 1 for Status, 2 for Symptoms, 3 for Emergency SOS, or 4 for Refills.`
    }

    newMsgs.push({ sender: 'bot', text: reply, time: 'Just now' })
    setWaMessages(newMsgs)
    setWaInput('')
  }

  // USSD State
  const [ussdDialed, setUssdDialed] = useState(false)
  const [ussdScreen, setUssdScreen] = useState<'root' | 'bp' | 'refill' | 'next_visit' | 'sos' | 'success'>('root')
  const [ussdInput, setUssdInput] = useState('')
  const [ussdMessage, setUssdMessage] = useState('')

  const handleUssdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const choice = ussdInput.trim()

    if (ussdScreen === 'root') {
      if (choice === '1') {
        setUssdScreen('next_visit')
        setUssdMessage('Materna AI Care Record:\nNext Antenatal Clinic: Thursday, Aug 27 at 9:00 AM at Lagos Island Maternity.\n\n0. Back to Main Menu')
      } else if (choice === '2') {
        setUssdScreen('bp')
        setUssdMessage('Enter your Home Blood Pressure reading from your cuff (e.g. 140/90):')
      } else if (choice === '3') {
        setUssdScreen('refill')
        setUssdMessage('Active Rx Refill:\n1. Methyldopa 250mg (₦4,500)\n2. Pregnacare Plus (₦11,200)\n\nReply with 1 or 2 to confirm home delivery:')
      } else if (choice === '4') {
        setUssdScreen('sos')
        setUssdMessage('🚨 EMERGENCY SOS SENT!\nYour assigned clinician & family caregiver have been alerted with your location. Hospital Emergency Line: 112 / 767.')
      } else {
        setUssdMessage('Invalid option. Reply 1, 2, 3, or 4.')
      }
    } else if (ussdScreen === 'bp') {
      setUssdScreen('success')
      setUssdMessage(`✓ BP (${choice}) recorded in your Materna AI hospital file. Nurse Ifeoma notified.`)
    } else if (ussdScreen === 'refill') {
      setUssdScreen('success')
      setUssdMessage('✓ Refill order dispatched to partner pharmacy! Dispatch rider will call you on delivery.')
    } else {
      setUssdScreen('root')
    }
    setUssdInput('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-xs font-bold">
            ← Main Portal
          </Link>
          <span className="text-slate-600">/</span>
          <div>
            <h1 className="font-bold text-white text-sm">Low-Connectivity & Omnichannel Fallback Hub</h1>
            <p className="text-[11px] text-teal-400">Serving rural and low-data patients across Nigeria</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            💬 WhatsApp Bot
          </button>
          <button
            onClick={() => setActiveTab('ussd')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              activeTab === 'ussd'
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            📟 USSD (*384*628#)
          </button>
          <button
            onClick={() => setActiveTab('escalation')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              activeTab === 'escalation'
                ? 'bg-blue-950 border-blue-500 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            🔄 Multi-Tier Escalation
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Tab 1: WhatsApp Simulator */}
        {activeTab === 'whatsapp' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                WhatsApp Conversational Channel
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recognizing that over 90% of connected smartphone users in Nigeria actively use WhatsApp, Materna AI provides a verified WhatsApp business bot that communicates in plain English, Pidgin, and local languages.
              </p>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                <span className="font-bold text-emerald-400 block">Quick Test Prompts:</span>
                <button
                  onClick={() => handleSendWhatsApp('2')}
                  className="w-full text-left bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500 text-slate-200"
                >
                  Reply "2" (Report Mild Headache/Swelling)
                </button>
                <button
                  onClick={() => handleSendWhatsApp('4')}
                  className="w-full text-left bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500 text-slate-200"
                >
                  Reply "4" (Trigger Methyldopa Refill Delivery)
                </button>
                <button
                  onClick={() => handleSendWhatsApp('3')}
                  className="w-full text-left bg-rose-950/60 p-2.5 rounded-xl border border-rose-800 hover:border-rose-500 text-rose-200 font-bold"
                >
                  Reply "3" (Emergency Danger Warning)
                </button>
              </div>
            </div>

            {/* WhatsApp Phone Mockup (7 cols) */}
            <div className="md:col-span-7 bg-[#0b141a] border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
              {/* WhatsApp Header */}
              <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">Materna AI Official</span>
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Verified Clinical Assistant</p>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">🔒 End-to-end encrypted</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a]">
                {waMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <span className="block text-[9px] text-slate-400 text-right mt-1">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp Input */}
              <div className="bg-[#202c33] p-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message or number..."
                  value={waInput}
                  onChange={(e) => setWaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                  className="flex-1 bg-[#2a3942] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => handleSendWhatsApp()}
                  className="bg-[#00a884] hover:bg-[#008f72] text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: USSD Feature Phone Simulator */}
        {activeTab === 'ussd' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                USSD (*384*628#) for Non-Smartphone Users
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                For patients like Musa in Kano or mothers without smartphones or active mobile data packages, Materna AI works over zero-data USSD on all Nigerian telecom networks (MTN, Airtel, Glo, 9mobile).
              </p>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
                <span className="font-bold text-amber-400 block">Key Features Supported:</span>
                <p>• Check upcoming antenatal appointment date</p>
                <p>• Report home blood pressure cuff readings</p>
                <p>• Request prescription refill delivery</p>
                <p>• Trigger emergency SOS to assigned clinician & family</p>
              </div>
            </div>

            {/* USSD Phone Screen (7 cols) */}
            <div className="md:col-span-7 flex justify-center">
              <div className="w-[320px] bg-slate-900 border-4 border-slate-700 rounded-[40px] p-6 shadow-2xl space-y-4">
                <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto" />

                {!ussdDialed ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4 min-h-[260px] flex flex-col justify-center items-center">
                    <p className="font-mono text-xl font-black text-amber-400 tracking-wider">*384*628#</p>
                    <p className="text-[11px] text-slate-400">Materna AI Continuity Service</p>
                    <button
                      onClick={() => {
                        setUssdDialed(true)
                        setUssdScreen('root')
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-full text-xs transition shadow-lg flex items-center gap-2"
                    >
                      <span>📞</span> Dial Code
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-100 text-slate-950 rounded-2xl p-4 min-h-[260px] flex flex-col justify-between text-xs font-mono shadow-inner">
                    <div className="space-y-2">
                      <p className="font-bold border-b border-amber-300 pb-1">Materna AI — USSD Menu</p>
                      {ussdScreen === 'root' && (
                        <div className="space-y-1 text-[11px]">
                          <p>1. Check Next Clinic Date</p>
                          <p>2. Log Home Blood Pressure</p>
                          <p>3. Request Medication Refill</p>
                          <p>4. Trigger Emergency SOS</p>
                        </div>
                      )}
                      {ussdScreen !== 'root' && (
                        <p className="whitespace-pre-wrap text-[11px] leading-relaxed">{ussdMessage}</p>
                      )}
                    </div>

                    <form onSubmit={handleUssdSubmit} className="pt-2 border-t border-amber-300 space-y-2">
                      <input
                        type="text"
                        placeholder="Enter response number..."
                        value={ussdInput}
                        onChange={(e) => setUssdInput(e.target.value)}
                        className="w-full bg-white border border-amber-400 rounded px-2 py-1 text-xs text-slate-950 font-mono"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUssdDialed(false)}
                          className="flex-1 bg-amber-200 hover:bg-amber-300 text-slate-900 py-1 rounded text-[11px] font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-slate-950 hover:bg-slate-850 text-white py-1 rounded text-[11px] font-bold"
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="w-10 h-10 rounded-full border-2 border-slate-700 mx-auto" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Multi-Tier Escalation Flow */}
        {activeTab === 'escalation' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Adaptive Medication & Appointment Escalation Protocol</h2>
              <p className="text-xs text-slate-400 mt-1">
                Adherence support over gamification — escalating channels automatically adapt to patient responsiveness.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400">Tier 1: Push Notification</span>
                  <span className="text-[10px] bg-blue-950 px-2 py-0.5 rounded text-blue-300">Default</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Daily reminder sent to smartphone app at 08:00 AM for scheduled doses (e.g. Methyldopa 250mg).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">Tier 2: SMS / WhatsApp</span>
                  <span className="text-[10px] bg-amber-950 px-2 py-0.5 rounded text-amber-300">1 Missed Dose</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  If unconfirmed after 4 hours, auto-escalates to zero-data SMS and WhatsApp reminder to patient and registered spouse.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-rose-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400">Tier 3: CHW In-Person Call</span>
                  <span className="text-[10px] bg-rose-950 px-2 py-0.5 rounded text-rose-300">Consecutive Misses</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Dispatches direct outreach task to assigned Community Health Worker (Amina Bello) to visit patient's home.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
