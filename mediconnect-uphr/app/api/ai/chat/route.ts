import { NextResponse } from 'next/server'
import { getCopilotResponse, toPatientRecordSummary, type CopilotMessage } from '@/lib/copilot'

export async function POST(req: Request) {
  try {
    const { messages, patient, patientId, message } = await req.json()

    const rawId = patientId || patient?.health_id || patient?.id || 'MAT-AMK-2026'
    const record = toPatientRecordSummary(rawId)

    const rawHistory: CopilotMessage[] = Array.isArray(messages)
      ? messages.slice(0, -1).flatMap((m: any) => {
          if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return []
          return [{ role: m.role, content: m.content }]
        })
      : []

    const lastMessage = message || (Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1]?.content : '')

    if (!lastMessage) {
      return NextResponse.json({ error: 'Please provide a message for the copilot.' }, { status: 400 })
    }

    const result = await getCopilotResponse(record, rawHistory, lastMessage)

    return NextResponse.json({
      reply: result.reply,
      escalated: result.escalated,
      redFlagCategory: result.redFlagCategory
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'The health assistant is temporarily unavailable. Please try again or contact a clinician for medical help.', code: 'AI_UNAVAILABLE' },
      { status: 503 }
    )
  }
}
