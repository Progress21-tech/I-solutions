'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/components/LanguageProvider'
import { supportedLanguages } from '@/lib/languages'

interface Message { role: 'user' | 'assistant'; content: string }
type SpeechRecognitionInstance = {
  lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null; onend: (() => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

export default function PatientChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [patient, setPatient] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [isListening, setIsListening] = useState(false)
  const [voiceNotice, setVoiceNotice] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const router = useRouter()
  const { language, copy } = useLanguage()

  useEffect(() => { void fetchPatientData() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchPatientData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: patientData } = await supabase.from('patients').select('*').eq('user_id', user.id).single()
    if (!patientData) return
    setPatient(patientData)
    const { data: recordsData } = await supabase.from('records').select('*').eq('patient_id', patientData.id).order('created_at', { ascending: false })
    const currentRecords = recordsData || []
    setRecords(currentRecords)
    if (currentRecords.length) await generateSummary(patientData, currentRecords)
    else setMessages([{ role: 'assistant', content: copy.askHealth }])
  }

  const generateSummary = async (patientData: any, recordsData: any[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient: patientData, records: recordsData, language }) })
      const data = await response.json()
      setMessages([{ role: 'assistant', content: response.ok && data.summary ? data.summary : copy.retryMessage }])
    } catch { setMessages([{ role: 'assistant', content: copy.retryMessage }]) }
    finally { setLoading(false) }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const updatedMessages = [...messages, { role: 'user' as const, content: input.trim() }]
    setMessages(updatedMessages); setInput(''); setLoading(true)
    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: updatedMessages, patient, records, language }) })
      const data = await response.json()
      setMessages((previous) => [...previous, { role: 'assistant', content: response.ok && data.reply ? data.reply : copy.retryMessage }])
    } catch { setMessages((previous) => [...previous, { role: 'assistant', content: copy.retryMessage }]) }
    finally { setLoading(false) }
  }

  const startListening = () => {
    setVoiceNotice('')
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Recognition) { setVoiceNotice(copy.voiceInputUnavailable); return }
    const recognition = new Recognition()
    recognition.lang = supportedLanguages[language].voiceLocale
    recognition.continuous = false; recognition.interimResults = false
    recognition.onresult = (event) => setInput((current) => `${current}${current ? ' ' : ''}${event.results[0][0].transcript}`)
    recognition.onerror = () => setVoiceNotice(copy.voiceInputUnavailable)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition; setIsListening(true); recognition.start()
  }

  const speak = (content: string) => {
    setVoiceNotice('')
    if (!('speechSynthesis' in window)) { setVoiceNotice(copy.voiceUnavailable); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.lang = supportedLanguages[language].voiceLocale
    const matchingVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase() === utterance.lang.toLowerCase())
    if (language !== 'en' && language !== 'pcm' && !matchingVoice) { setVoiceNotice(copy.voiceUnavailable); return }
    if (matchingVoice) utterance.voice = matchingVoice
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.back()} aria-label="Go back" className="text-slate-700 hover:text-slate-950">←</button><div><h1 className="font-semibold text-slate-950">{copy.healthAssistant}</h1><p className="text-xs text-slate-700">{copy.poweredBy}</p></div></div>
        <LanguageSwitcher />
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${message.role === 'user' ? 'bg-blue-700 text-white rounded-br-sm' : 'bg-white text-slate-950 shadow-sm rounded-bl-sm'}`}><p>{message.content}</p>{message.role === 'assistant' && <div className="mt-3 flex gap-2"><button onClick={() => speak(message.content)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50">{copy.readAloud}</button><button onClick={() => window.speechSynthesis?.cancel()} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50">{copy.stopReading}</button></div>}</div></div>)}
        {loading && <div className="flex justify-start"><div className="bg-white px-4 py-3 rounded-2xl shadow-sm text-sm text-slate-800">{copy.healthAssistant}…</div></div>}<div ref={messagesEndRef} />
      </main>
      <aside className="px-6 py-3 bg-amber-50 border-t border-amber-200"><p className="text-xs text-amber-950 text-center">{copy.disclaimer}</p></aside>
      <div className="bg-white px-6 py-3 text-center"><button onClick={() => router.push('/patient/care?type=doctor')} className="text-sm font-semibold text-blue-800 underline">Find nearby care</button></div>
      {voiceNotice && <p role="status" className="bg-slate-100 px-6 py-2 text-center text-xs text-slate-800">{voiceNotice}</p>}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 flex gap-3"><input type="text" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void sendMessage()} placeholder={copy.placeholder} className="flex-1 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-950 placeholder:text-slate-600 focus:outline-none focus:border-blue-700" disabled={loading} /><button type="button" onClick={isListening ? () => recognitionRef.current?.stop() : startListening} disabled={loading} aria-label={isListening ? copy.stop : copy.listening} className="rounded-xl border-2 border-blue-700 px-4 py-3 font-medium text-blue-800 hover:bg-blue-50 disabled:opacity-50">{isListening ? copy.stop : '🎙️'}</button><button onClick={() => void sendMessage()} disabled={loading || !input.trim()} className="bg-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-800 disabled:opacity-50">{copy.send}</button></footer>
    </div>
  )
}
