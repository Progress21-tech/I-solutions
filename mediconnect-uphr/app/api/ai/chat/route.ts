import { NextResponse } from 'next/server'
import { getAIProvider, parseLanguage, patientAssistantSystemPrompt, type AIMessage } from '@/lib/ai/provider'

export async function POST(req: Request) {
  try {
    const { messages, patient, records, language } = await req.json()
    const selectedLanguage = parseLanguage(language)
    const safeMessages: AIMessage[] = Array.isArray(messages)
      ? messages.slice(-20).flatMap((message: unknown) => {
          if (!message || typeof message !== 'object') return []
          const candidate = message as { role?: unknown; content?: unknown }
          if ((candidate.role !== 'user' && candidate.role !== 'assistant') || typeof candidate.content !== 'string') return []
          return [{ role: candidate.role, content: candidate.content.slice(0, 4000) }]
        })
      : []

    if (!safeMessages.length) {
      return NextResponse.json({ error: 'Please provide a message for the health assistant.' }, { status: 400 })
    }

    const reply = await getAIProvider().generateText({
      system: patientAssistantSystemPrompt(patient, Array.isArray(records) ? records : [], selectedLanguage),
      messages: safeMessages,
    })

    if (!reply) throw new Error('AI provider returned no text')
    return NextResponse.json({ reply, language: selectedLanguage })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'The health assistant is temporarily unavailable. Please try again or contact a clinician for medical help.', code: 'AI_UNAVAILABLE' }, { status: 503 })
  }
}
