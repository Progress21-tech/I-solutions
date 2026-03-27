'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function PatientChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [patient, setPatient] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchPatientData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchPatientData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (patientData) {
      setPatient(patientData)

      const { data: recordsData } = await supabase
        .from('records')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })

      setRecords(recordsData || [])

      // Auto generate summary on load
      if (recordsData && recordsData.length > 0) {
        generateSummary(patientData, recordsData)
      } else {
        setMessages([{
          role: 'assistant',
          content: `Hello ${patientData.full_name} 👋 I am your personal health assistant. You don't have any medical records yet. Once your doctor uploads your records I can help you understand your health condition in simple terms. Feel free to ask me any general health questions!`
        }])
      }
    }
  }

  const generateSummary = async (patientData: any, recordsData: any[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: patientData,
          records: recordsData,
        }),
      })

      const data = await response.json()
      setMessages([{
        role: 'assistant',
        content: data.summary
      }])
    } catch (error) {
      setMessages([{
        role: 'assistant',
        content: `Hello ${patientData.full_name} 👋 I am your personal health assistant. Ask me anything about your health records and I will explain it in simple terms.`
      }])
    }
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user' as const, content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          patient,
          records,
        }),
      })

      const data = await response.json()
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: data.reply
      }])
    } catch (error) {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Sorry I could not process that. Please try again.'
      }])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ←
          </button>
          <div>
            <h1 className="font-semibold text-gray-800">Health Assistant</h1>
            <p className="text-xs text-gray-400">Powered by AI</p>
          </div>
        </div>
        <span className="text-2xl">🤖</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-2 bg-yellow-50 border-t border-yellow-100">
        <p className="text-xs text-yellow-700 text-center">
          ⚠️ This AI is for information only. Always consult your doctor for medical advice.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about your health..."
         className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
